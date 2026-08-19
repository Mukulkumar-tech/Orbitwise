import mongoose from 'mongoose';
import { APPLICATION_STATUS, APPLICATION_STATUS_VALUES, INTAKE_SEASONS } from '../constants/index.js';

/**
 * One timeline entry.
 *
 * Append-only, written exclusively by the service layer on a status transition.
 * The UI timeline is a projection of this history rather than hand-maintained
 * state, so what a student sees is what actually happened — in order, with who
 * did it.
 */
const timelineEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPLICATION_STATUS_VALUES, required: true },
    note: { type: String, default: '', maxlength: 500 },
    /** 'student' | 'counsellor' | 'admin' | 'system' — who caused the change. */
    actor: { type: String, default: 'system' },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const noteSchema = new mongoose.Schema(
  {
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, default: '' },
    /**
     * Counsellor-only working notes. Filtered out of every student-facing
     * response by the service, never by the client — a flag the browser is
     * trusted to respect is not a privacy control.
     */
    isPrivate: { type: Boolean, default: false },
    at: { type: Date, default: Date.now },
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', default: null },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    /**
     * What the course looked like when the student applied.
     *
     * Deliberately duplicated from Course. An application is a historical record:
     * if tuition rises or a programme is discontinued, the student's own record of
     * what they applied to — and at what price — must not silently change
     * underneath them. The live Course is still referenced for current detail.
     */
    snapshot: {
      courseTitle: { type: String, required: true },
      universityName: { type: String, required: true },
      countryCode: { type: String, required: true },
      countryName: { type: String, default: '' },
      city: { type: String, default: '' },
      degreeLevel: { type: String, required: true },
      field: { type: String, default: '' },
      durationMonths: { type: Number, default: null },
      tuitionPerYearInr: { type: Number, default: null },
      programmeCostInr: { type: Number, default: null },
      minIelts: { type: Number, default: null },
      courseSlug: { type: String, default: '' },
      /** OrbitMatch score at the moment of applying, for later comparison. */
      matchScoreAtApply: { type: Number, default: null },
    },

    status: {
      type: String,
      enum: APPLICATION_STATUS_VALUES,
      default: APPLICATION_STATUS.DRAFT,
      index: true,
    },

    intake: {
      season: { type: String, enum: [...INTAKE_SEASONS, ''], default: '' },
      year: { type: Number, default: null },
    },

    /** Documents attached to this application; populated from Phase 10 onward. */
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],

    timeline: { type: [timelineEntrySchema], default: [] },
    notes: { type: [noteSchema], default: [] },

    submittedAt: { type: Date, default: null },
    decision: {
      outcome: { type: String, enum: ['offer', 'rejection', ''], default: '' },
      at: { type: Date, default: null },
      note: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

// Role-scoped list queries: a student's own applications, a counsellor's caseload.
applicationSchema.index({ student: 1, status: 1, updatedAt: -1 });
applicationSchema.index({ counsellor: 1, status: 1 });

/**
 * One application per student per course, enforced by the database.
 *
 * Two "Apply" clicks — a double submit, or a second tab — would otherwise create
 * duplicate applications that a university would reject and a student would have
 * to untangle. A unique index makes that impossible rather than unlikely.
 */
applicationSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
