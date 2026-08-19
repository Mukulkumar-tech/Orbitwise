import mongoose from 'mongoose';
import slugify from 'slugify';
import { DEGREE_LEVELS, STUDY_FIELDS } from '../constants/index.js';

/**
 * A funding award.
 *
 * Value is stored twice — in the awarding currency for display, and in rupees for
 * comparison and budget arithmetic — for the same reason courses are: a student
 * comparing a £5,000 award against a CAD 8,000 one needs both on the same scale,
 * and converting at read time would make the number that produced a
 * recommendation unreproducible later.
 */
const scholarshipSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, index: true },
    provider: { type: String, required: true, trim: true },

    /**
     * Scope. A scholarship is offered by an institution, or by a country /
     * government, or is open globally. Both references are optional and a
     * scholarship may set neither.
     */
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
    universityName: { type: String, default: '' },
    countryCode: { type: String, uppercase: true, trim: true, default: '', index: true },
    countryName: { type: String, default: '' },

    award: {
      /** 'percentage' of tuition · 'fixed' cash amount · 'full' ride. */
      type: { type: String, enum: ['percentage', 'fixed', 'full'], required: true },
      /** Percent of tuition when type is 'percentage'; ignored for 'full'. */
      percentOfTuition: { type: Number, min: 0, max: 100, default: 0 },
      /** Cash value in the awarding currency when type is 'fixed'. */
      amount: { type: Number, min: 0, default: 0 },
      currency: { type: String, uppercase: true, trim: true, default: 'INR' },
      /** Normalized cash value, for ranking and budget maths. Null for percentage awards. */
      amountInr: { type: Number, min: 0, default: null },
      /** 'per_year' | 'one_time' — a per-year award is worth duration times more. */
      recurrence: { type: String, enum: ['per_year', 'one_time'], default: 'per_year' },
    },

    /** What the money covers, for the card's supporting line. */
    coverage: { type: [String], default: [] },

    eligibility: {
      degreeLevels: { type: [{ type: String, enum: DEGREE_LEVELS }], default: [] },
      fields: { type: [{ type: String, enum: STUDY_FIELDS }], default: [] },
      minPercentage: { type: Number, min: 0, max: 100, default: null },
      minIelts: { type: Number, min: 0, max: 9, default: null },
      /** Empty means open to all nationalities. */
      nationalities: { type: [String], default: [] },
      needsFinancialNeed: { type: Boolean, default: false },
      notes: { type: String, default: '' },
    },

    /**
     * Application deadline. Nullable because some awards are assessed
     * automatically at admission and have no separate deadline — modelling that
     * as a date would invent an urgency the student does not actually face.
     */
    deadline: { type: Date, default: null, index: true },
    /** True when the award is granted with the offer rather than applied for. */
    automatic: { type: Boolean, default: false },

    applicationUrl: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 600 },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

scholarshipSchema.index({ isActive: 1, deadline: 1 });
scholarshipSchema.index({ countryCode: 1, isActive: 1 });

/** Days until the deadline; null when there is none, negative when passed. */
scholarshipSchema.virtual('daysRemaining').get(function () {
  if (!this.deadline) return null;
  return Math.ceil((this.deadline.getTime() - Date.now()) / 86_400_000);
});

scholarshipSchema.pre('validate', function deriveSlug(next) {
  if (this.name && (this.isModified('name') || !this.slug)) {
    // Provider is folded in because award names repeat across institutions —
    // "International Merit Award" exists at a dozen universities.
    this.slug = slugify(`${this.name} ${this.provider}`, { lower: true, strict: true });
  }
  next();
});

export default mongoose.model('Scholarship', scholarshipSchema);
