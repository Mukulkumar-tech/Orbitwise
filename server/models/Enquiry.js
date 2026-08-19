import mongoose from 'mongoose';
import { EDUCATION_LEVEL_VALUES } from '../constants/index.js';

/**
 * A counselling request from the public contact form.
 *
 * Persisted rather than only emailed: an SMTP outage must not lose a lead, and a
 * counsellor needs a worklist rather than an inbox. `status` is what turns this
 * from a message into something someone owns.
 */
const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },

    /** Optional context — the form works without it, but it routes better with it. */
    educationLevel: { type: String, enum: [...EDUCATION_LEVEL_VALUES, ''], default: '' },
    interestedCountries: { type: [String], default: [] },
    message: { type: String, required: true, trim: true, maxlength: 2000 },

    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'closed'],
      default: 'new',
      index: true,
    },
    /** Set once a counsellor picks it up. */
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    /**
     * Kept for abuse triage only, never returned to a client. A contact form is
     * the most-spammed surface on any site, and without this a flood is
     * indistinguishable from genuine interest.
     */
    submittedFromIp: { type: String, default: '', select: false },
  },
  { timestamps: true }
);

enquirySchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Enquiry', enquirySchema);
