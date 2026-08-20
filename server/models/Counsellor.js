import mongoose from 'mongoose';
import { STUDY_FIELDS } from '../constants/index.js';

/**
 * A counsellor's professional profile and working hours.
 *
 * Separate from the User document rather than merged into it: a User is an
 * identity, and this is a role-specific profile with availability, specialisms
 * and a caseload. Merging them would put nine unused fields on every student.
 */
const availabilitySchema = new mongoose.Schema(
  {
    /** 0 = Sunday, matching Date.prototype.getDay(). */
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    /** Minutes from midnight, so a slot is integer arithmetic rather than string parsing. */
    startMinute: { type: Number, required: true, min: 0, max: 1439 },
    endMinute: { type: Number, required: true, min: 1, max: 1440 },
  },
  { _id: false }
);

const counsellorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },

    title: { type: String, default: 'Education Counsellor', trim: true, maxlength: 80 },
    bio: { type: String, default: '', maxlength: 600 },
    experienceYears: { type: Number, min: 0, default: 0 },

    /** Country codes this counsellor advises on. Empty means all. */
    countries: { type: [{ type: String, uppercase: true, maxlength: 2 }], default: [] },
    fields: { type: [{ type: String, enum: STUDY_FIELDS }], default: [] },
    languages: { type: [String], default: ['English'] },

    availability: { type: [availabilitySchema], default: [] },
    /** Length of a booking, so slot generation and conflict checks agree. */
    slotMinutes: { type: Number, default: 30, min: 15, max: 120 },

    /**
     * Students this counsellor advises.
     *
     * Held here rather than as a `counsellor` field on StudentProfile because the
     * counsellor's caseload is the query that actually runs — "show me my
     * students" — and a single array read beats scanning every profile.
     */
    assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    isAcceptingStudents: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

counsellorSchema.index({ isActive: 1, isAcceptingStudents: 1 });

counsellorSchema.virtual('caseloadSize').get(function () {
  return this.assignedStudents?.length ?? 0;
});

export default mongoose.model('Counsellor', counsellorSchema);
