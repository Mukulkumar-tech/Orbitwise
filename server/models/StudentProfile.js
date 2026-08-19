import mongoose from 'mongoose';
import {
  ACADEMIC_STREAMS,
  DEGREE_LEVELS,
  EDUCATION_LEVEL_VALUES,
  ENGLISH_TESTS,
  FUNDING_SOURCES,
  GRADING_SYSTEMS,
  INTAKE_SEASONS,
  STUDY_FIELDS,
} from '../constants/index.js';
import { toIeltsEquivalent, toPercentage } from '../services/academics.js';

/**
 * Everything a student tells us about themselves, and nothing else.
 *
 * Kept in its own collection rather than on `User` for three reasons: only one
 * role has one, it is written far more often than the account it belongs to, and
 * the account document is loaded on literally every authenticated request —
 * carrying a student's whole academic history through `protect` would make every
 * API call pay for data almost none of them read.
 *
 * Every field here is scored by OrbitMatch. Nothing is collected "for later":
 * a wizard step that does not change a recommendation is a step that should not
 * be asked.
 */

const marksSchema = new mongoose.Schema(
  {
    system: { type: String, enum: GRADING_SYSTEMS, default: 'percentage' },
    value: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // ─── Step 1 · Where you are academically ─────────────────────────────
    education: {
      level: { type: String, enum: EDUCATION_LEVEL_VALUES, default: null },
      stream: { type: String, enum: ACADEMIC_STREAMS, default: null },
      /** Board for school, institution for a degree — one field, one question. */
      boardOrInstitution: { type: String, trim: true, default: '', maxlength: 120 },
      /** Class 10/12 marks. Read by bachelor's-level requirements. */
      secondaryMarks: { type: marksSchema, default: () => ({}) },
      /** Degree marks. Read by master's-level requirements. */
      tertiaryMarks: { type: marksSchema, default: () => ({}) },
      /** Completion year — in the future for a student still studying. */
      yearOfCompletion: { type: Number, min: 1970, max: 2100, default: null },
      backlogs: { type: Number, min: 0, max: 50, default: 0 },
    },

    // ─── Step 2 · What you want to study ─────────────────────────────────
    goal: {
      degreeLevel: { type: String, enum: DEGREE_LEVELS, default: null },
      // Ordered by preference; the first entry is the student's first choice.
      fields: { type: [{ type: String, enum: STUDY_FIELDS }], default: [] },
      intake: {
        season: { type: String, enum: INTAKE_SEASONS, default: null },
        year: { type: Number, min: 2020, max: 2100, default: null },
      },
    },

    // ─── Step 3 · Where you want to go ───────────────────────────────────
    /** Country codes, ordered by preference. Empty means "open to anywhere". */
    destinations: { type: [{ type: String, uppercase: true, maxlength: 2 }], default: [] },

    // ─── Step 4 · What you can spend ─────────────────────────────────────
    budget: {
      /** Rupees per year, tuition + living combined — how families actually plan. */
      annualInr: { type: Number, min: 0, default: null },
      fundingSource: { type: String, enum: FUNDING_SOURCES, default: null },
      needsScholarship: { type: Boolean, default: false },
    },

    // ─── Step 5 · English test ───────────────────────────────────────────
    english: {
      test: { type: String, enum: ENGLISH_TESTS, default: 'none' },
      overall: { type: Number, min: 0, default: null },
      testDate: { type: Date, default: null },
    },

    /** Optional context, relevant to master's admission rather than the wizard. */
    work: {
      years: { type: Number, min: 0, max: 50, default: 0 },
    },

    shortlist: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
      default: [],
    },

    /** Set the first time the wizard is completed; never cleared by an edit. */
    onboardingCompletedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

/**
 * Marks as a percentage, whatever notation they were entered in.
 *
 * Exposed as virtuals so the client can show "78.5%" beside a CGPA of 8.3 and a
 * scorer never has to remember to convert. See academics.toPercentage for why the
 * conversion is not a linear stretch.
 */
studentProfileSchema.virtual('secondaryPercentage').get(function () {
  return toPercentage(this.education?.secondaryMarks);
});

studentProfileSchema.virtual('tertiaryPercentage').get(function () {
  return toPercentage(this.education?.tertiaryMarks);
});

studentProfileSchema.virtual('ieltsEquivalent').get(function () {
  return toIeltsEquivalent(this.english);
});

export default mongoose.model('StudentProfile', studentProfileSchema);
