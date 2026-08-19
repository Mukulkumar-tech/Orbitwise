import mongoose from 'mongoose';
import slugify from 'slugify';

/**
 * An institution offering courses.
 *
 * `countryCode` duplicates the country reference on purpose. Recommendation
 * queries filter courses by destination on every dashboard load, and a
 * denormalized two-character code is one indexed comparison where a join through
 * the country collection would be an aggregation pipeline.
 */
const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true },

    country: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
    countryCode: { type: String, required: true, uppercase: true, index: true },
    city: { type: String, required: true, trim: true },

    type: { type: String, enum: ['public', 'private'], default: 'public' },
    establishedYear: { type: Number, min: 1000, max: 2100, default: null },
    worldRanking: { type: Number, min: 1, default: null },

    /**
     * Share of applicants admitted, as a percentage.
     *
     * Drives the admission-likelihood scorer: a strong profile at a 6%-acceptance
     * university is still an ambitious application, and a student deserves to be
     * told that before they pay the application fee.
     */
    acceptanceRate: { type: Number, min: 0, max: 100, default: null },
    internationalStudentShare: { type: Number, min: 0, max: 100, default: null },

    description: { type: String, default: '', maxlength: 600 },
    highlights: { type: [String], default: [] },

    applicationFeeInr: { type: Number, min: 0, default: 0 },
    scholarshipAvailable: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Course listings sort by ranking within a destination.
universitySchema.index({ countryCode: 1, worldRanking: 1 });

universitySchema.pre('validate', function deriveSlug(next) {
  if (this.name && (this.isModified('name') || !this.slug)) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

/** Selectivity in words, so cards never have to interpret a bare percentage. */
universitySchema.virtual('selectivity').get(function () {
  const rate = this.acceptanceRate;
  if (rate == null) return 'unknown';
  if (rate <= 15) return 'highly_selective';
  if (rate <= 40) return 'selective';
  if (rate <= 70) return 'moderate';
  return 'accessible';
});

export default mongoose.model('University', universitySchema);
