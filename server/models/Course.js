import mongoose from 'mongoose';
import slugify from 'slugify';
import {
  DEGREE_LEVELS,
  EDUCATION_LEVEL_VALUES,
  INTAKE_SEASONS,
  STUDY_FIELDS,
} from '../constants/index.js';

/**
 * Entry requirements, in the form an admissions page states them.
 *
 * Two marks thresholds rather than one because they are read against different
 * qualifications: a bachelor's course judges Class 12, a master's course judges
 * the degree (see academics.requirementBasis). Storing a single `minMarks` would
 * force every consumer to re-derive which qualification it referred to.
 */
const requirementsSchema = new mongoose.Schema(
  {
    minEducationLevel: { type: String, enum: EDUCATION_LEVEL_VALUES, required: true },
    minSecondaryPercentage: { type: Number, min: 0, max: 100, default: null },
    minTertiaryPercentage: { type: Number, min: 0, max: 100, default: null },
    /** Stored as IELTS; other tests are converted before comparison. */
    minIelts: { type: Number, min: 0, max: 9, default: 6.5 },
    maxBacklogs: { type: Number, min: 0, default: 5 },
    minWorkExperienceYears: { type: Number, min: 0, default: 0 },
    /** Free-text extras a scorer cannot judge but a student must read. */
    additional: { type: [String], default: [] },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true },

    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    /** Denormalized for card display and text search without a populate. */
    universityName: { type: String, required: true },
    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    countryCode: { type: String, required: true, uppercase: true, index: true },
    city: { type: String, default: '' },

    degreeLevel: { type: String, enum: DEGREE_LEVELS, required: true, index: true },
    field: { type: String, enum: STUDY_FIELDS, required: true, index: true },
    durationMonths: { type: Number, required: true, min: 3, max: 96 },

    /** Local-currency tuition for display. */
    tuitionPerYear: {
      amount: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, uppercase: true },
    },
    /** The same tuition in rupees — what budget scoring and sorting compare. */
    tuitionPerYearInr: { type: Number, required: true, min: 0, index: true },

    intakes: { type: [{ type: String, enum: INTAKE_SEASONS }], default: [] },
    requirements: { type: requirementsSchema, required: true },

    scholarship: {
      available: { type: Boolean, default: false },
      maxPercentOfTuition: { type: Number, min: 0, max: 100, default: 0 },
      note: { type: String, default: '' },
    },

    careerOutcomes: { type: [String], default: [] },
    /** Indicative graduate starting salary in rupees, for the ROI line. */
    averageStartingSalaryInr: { type: Number, min: 0, default: null },
    highlights: { type: [String], default: [] },
    summary: { type: String, default: '', maxlength: 600 },

    isActive: { type: Boolean, default: true, index: true },
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

/**
 * The recommendation query's shape, as one compound index.
 *
 * Every dashboard load filters on active + eligible degree levels + preferred
 * destinations + field, then scores the survivors in memory. Without this index
 * that filter is a collection scan on the largest collection in the platform.
 */
courseSchema.index({ isActive: 1, degreeLevel: 1, countryCode: 1, field: 1 });
courseSchema.index({ title: 'text', universityName: 'text', summary: 'text' });

courseSchema.pre('validate', function deriveSlug(next) {
  // Titles repeat across institutions — "MSc Computer Science" exists at dozens —
  // so the university name is part of the slug or the unique index rejects the
  // second university to be seeded.
  if (this.title && this.universityName && (this.isModified('title') || !this.slug)) {
    this.slug = slugify(`${this.title} ${this.universityName}`, { lower: true, strict: true });
  }
  next();
});

courseSchema.virtual('totalTuitionInr').get(function () {
  return Math.round(this.tuitionPerYearInr * (this.durationMonths / 12));
});

export default mongoose.model('Course', courseSchema);
