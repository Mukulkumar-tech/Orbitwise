import mongoose from 'mongoose';
import slugify from 'slugify';
import { INTAKE_SEASONS } from '../constants/index.js';

/**
 * A study destination.
 *
 * Costs are stored twice — once in the local currency for display, once in rupees
 * for comparison. Converting at read time would mean a student's ₹25L budget was
 * compared against a number in five different currencies, and the exchange rate
 * that produced a recommendation would be unreproducible a month later.
 */
const countrySchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 2,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    flag: { type: String, default: '' }, // emoji — no asset pipeline for 8 flags
    currency: { type: String, required: true, uppercase: true, trim: true },

    /** Annual living cost (accommodation, food, transport, phone) in rupees. */
    livingCostPerYearInr: { type: Number, required: true, min: 0 },
    /** Indicative tuition span in rupees, for "from ₹X per year" copy. */
    tuitionRangeInr: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },

    visaSuccessRate: { type: Number, min: 0, max: 100, default: null },
    visaFeeInr: { type: Number, min: 0, default: 0 },

    workRights: {
      hoursPerWeekDuringStudy: { type: Number, min: 0, default: 20 },
      postStudyWorkYears: { type: Number, min: 0, default: 2 },
    },

    /** True when the destination has a documented study→work→PR route. */
    prPathway: { type: Boolean, default: false },

    intakes: { type: [{ type: String, enum: INTAKE_SEASONS }], default: [] },
    popularCities: { type: [String], default: [] },

    /** The band most universities in the country ask for — a planning figure. */
    typicalIelts: { type: Number, min: 0, max: 9, default: 6.5 },

    summary: { type: String, default: '', maxlength: 400 },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

countrySchema.virtual('totalCostRangeInr').get(function () {
  return {
    min: this.tuitionRangeInr.min + this.livingCostPerYearInr,
    max: this.tuitionRangeInr.max + this.livingCostPerYearInr,
  };
});

countrySchema.pre('validate', function deriveSlug(next) {
  if (this.name && (this.isModified('name') || !this.slug)) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model('Country', countrySchema);
