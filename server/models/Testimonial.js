import mongoose from 'mongoose';

/**
 * A student success story.
 *
 * Denormalized on purpose — the course and university are stored as plain strings
 * rather than references. A testimonial is a historical statement about where
 * someone went in 2024; re-pointing it at a live Course document would let a
 * tuition edit silently rewrite someone's quoted story, and deleting a
 * discontinued course would orphan it.
 */
const testimonialSchema = new mongoose.Schema(
  {
    studentName: { type: String, required: true, trim: true },
    avatar: { type: String, default: '' },
    quote: { type: String, required: true, trim: true, maxlength: 600 },

    courseTitle: { type: String, required: true, trim: true },
    universityName: { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    countryName: { type: String, required: true, trim: true },

    /** Where the student started, so a reader can find someone like themselves. */
    fromCity: { type: String, default: '' },
    previousQualification: { type: String, default: '' },

    intakeYear: { type: Number, required: true },
    scholarshipPercent: { type: Number, min: 0, max: 100, default: 0 },
    rating: { type: Number, min: 1, max: 5, default: 5 },

    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Homepage asks for featured-and-published, newest first.
testimonialSchema.index({ isPublished: 1, isFeatured: -1, intakeYear: -1 });

export default mongoose.model('Testimonial', testimonialSchema);
