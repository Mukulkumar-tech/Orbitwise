import { z } from 'zod';
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

/**
 * Profile validation.
 *
 * Every section is optional and every field within it is too, because the wizard
 * saves after each step and the profile page edits one card at a time. The service
 * merges leaf paths (see profileService.applyPatch), so "optional" here means
 * "left untouched", never "cleared".
 *
 * Ranges are checked against the notation the student chose rather than one
 * generic 0–100: a CGPA of 9.2 is excellent and a percentage of 9.2 is a typo, and
 * only the pair of fields together can tell them apart.
 */

const CURRENT_YEAR = new Date().getFullYear();

/** Upper bound per grading system — the whole point of storing the system. */
const MARKS_CEILING = { percentage: 100, cgpa_10: 10, gpa_4: 4 };

const marksSchema = z
  .object({
    system: z.enum(GRADING_SYSTEMS).optional(),
    value: z.number().min(0, 'Marks cannot be negative').nullable().optional(),
  })
  .superRefine((marks, ctx) => {
    if (marks.value == null) return;
    const ceiling = MARKS_CEILING[marks.system ?? 'percentage'];
    if (marks.value > ceiling) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: `Maximum for this grading system is ${ceiling}`,
      });
    }
  });

const educationSchema = z.object({
  level: z.enum(EDUCATION_LEVEL_VALUES).optional(),
  stream: z.enum(ACADEMIC_STREAMS).nullable().optional(),
  boardOrInstitution: z.string().trim().max(120).optional(),
  secondaryMarks: marksSchema.optional(),
  tertiaryMarks: marksSchema.optional(),
  // A student still studying enters a future year, so the ceiling has to sit
  // ahead of today rather than at it.
  yearOfCompletion: z.number().int().min(1990).max(CURRENT_YEAR + 8).nullable().optional(),
  backlogs: z.number().int().min(0).max(50).optional(),
});

const goalSchema = z.object({
  degreeLevel: z.enum(DEGREE_LEVELS).optional(),
  // Three is the point at which "my interests" becomes "anything" and the field
  // scorer stops discriminating between courses at all.
  fields: z.array(z.enum(STUDY_FIELDS)).max(3, 'Pick up to three subject areas').optional(),
  intake: z
    .object({
      season: z.enum(INTAKE_SEASONS).nullable().optional(),
      year: z.number().int().min(CURRENT_YEAR).max(CURRENT_YEAR + 4).nullable().optional(),
    })
    .optional(),
});

const budgetSchema = z.object({
  // Floor and ceiling are sanity rails, not policy: below ₹1L nothing in the
  // catalogue is reachable, and above ₹5Cr the input is a mis-typed rupee figure.
  annualInr: z.number().min(100_000, 'Enter at least ₹1,00,000').max(50_000_000).nullable().optional(),
  fundingSource: z.enum(FUNDING_SOURCES).nullable().optional(),
  needsScholarship: z.boolean().optional(),
});

/** Valid score span for each test, in that test's own scale. */
const TEST_RANGE = {
  ielts: [0, 9],
  pte: [10, 90],
  toefl: [0, 120],
  duolingo: [10, 160],
};

const englishSchema = z
  .object({
    test: z.enum(ENGLISH_TESTS).optional(),
    overall: z.number().min(0).nullable().optional(),
    testDate: z.coerce.date().nullable().optional(),
  })
  .superRefine((english, ctx) => {
    if (english.overall == null) return;

    const range = TEST_RANGE[english.test];
    if (!range) {
      // 'none' or 'planned' with a score attached is contradictory input; saying so
      // is better than storing a number that no scorer will ever read.
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['overall'],
        message: 'Choose which test you took before entering a score',
      });
      return;
    }

    const [min, max] = range;
    if (english.overall < min || english.overall > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['overall'],
        message: `${english.test.toUpperCase()} scores run from ${min} to ${max}`,
      });
    }
  });

export const updateProfileSchema = z
  .object({
    education: educationSchema.optional(),
    goal: goalSchema.optional(),
    destinations: z
      .array(z.string().trim().length(2, 'Use two-letter country codes').toUpperCase())
      .max(5, 'Pick up to five destinations')
      .optional(),
    budget: budgetSchema.optional(),
    english: englishSchema.optional(),
    work: z.object({ years: z.number().min(0).max(50).optional() }).optional(),
  })
  // An empty body would save nothing and return 200, which reads as success to a
  // client whose payload never made it out of a broken form.
  .refine((body) => Object.keys(body).length > 0, { message: 'Nothing to update' });

export const courseIdParam = z.object({
  courseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid course id'),
});
