import mongoose from 'mongoose';
import { APPOINTMENT_STATUS, APPOINTMENT_TYPES } from '../constants/index.js';

/**
 * A booked counselling session.
 *
 * `startsAt` and `endsAt` are both stored rather than deriving the end from a
 * duration, because conflict detection is an interval-overlap query and doing
 * that arithmetic in Mongo on every check would be both slower and easier to get
 * wrong than storing the answer once.
 */
const appointmentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    type: { type: String, enum: APPOINTMENT_TYPES, required: true },
    status: { type: String, enum: APPOINTMENT_STATUS, default: 'requested', index: true },

    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },

    mode: { type: String, enum: ['video', 'phone', 'in_person'], default: 'video' },
    meetingLink: { type: String, default: '' },

    agenda: { type: String, default: '', maxlength: 500 },
    /** Written after the session. Visible to the student, unlike application notes. */
    outcome: { type: String, default: '', maxlength: 1000 },

    cancelledBy: { type: String, enum: ['student', 'counsellor', 'admin', ''], default: '' },
    cancelReason: { type: String, default: '', maxlength: 300 },
  },
  { timestamps: true }
);

/**
 * Drives both the conflict check and the counsellor's day view.
 *
 * Status is included because a cancelled slot must not block a rebooking — the
 * overlap query filters on live statuses only.
 */
appointmentSchema.index({ counsellor: 1, startsAt: 1, status: 1 });
appointmentSchema.index({ student: 1, startsAt: -1 });

export default mongoose.model('Appointment', appointmentSchema);
