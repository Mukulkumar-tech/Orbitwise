import { z } from 'zod';

import { ENGLISH_TESTS, GRADING_SYSTEMS, marksBasisFor, testTakesScore } from '../../constants/domain.js';

/**
 * The wizard's pure core: what each step asks, what counts as valid, and how the
 * answers map onto the profile the API stores.
 *
 * Kept out of the components so the rules are testable without rendering anything,
 * and so the form's shape (flat, one field per input) can stay independent of the
 * profile's shape (nested by section). Those two wanting different structures is
 * normal; conflating them is what produces components that reach four levels deep
 * to read a value.
 */

/** Flat form state — one key per input, which is what a controlled form wants. */
export const INITIAL_VALUES = {
  educationLevel: '',
  stream: '',
  boardOrInstitution: '',
  marksSystem: 'percentage',
  marksValue: '',
  yearOfCompletion: '',
  backlogs: '0',

  degreeLevel: '',
  fields: [],
  intakeSeason: '',
  intakeYear: '',

  destinations: [],

  budgetAnnualInr: '',
  fundingSource: '',
  needsScholarship: false,

  englishTest: '',
  englishOverall: '',
};

/** '' → undefined, '8.4' → 8.4. Empty is "not answered", never zero. */
const toNumber = (value) => {
  if (value === '' || value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const requiredChoice = (message) => z.string().min(1, message);

/* ═══════════════════════════════════════════════════════════════════════════
   VALIDATION
   ═══════════════════════════════════════════════════════════════════════════ */

const educationSchema = z
  .object({
    educationLevel: requiredChoice('Choose where you are academically'),
    marksSystem: z.enum(['percentage', 'cgpa_10', 'gpa_4']),
    marksValue: z.string().min(1, 'Enter your marks'),
    yearOfCompletion: z.string().optional(),
    backlogs: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const marks = toNumber(values.marksValue);
    const { max, label } = GRADING_SYSTEMS[values.marksSystem];

    if (marks == null || marks <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['marksValue'], message: 'Enter your marks as a number' });
      return;
    }
    if (marks > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['marksValue'],
        message: `${label} cannot exceed ${max}`,
      });
    }
  });

const goalSchema = z.object({
  degreeLevel: requiredChoice('Choose the qualification you want'),
  fields: z.array(z.string()).min(1, 'Pick at least one subject area').max(3, 'Pick up to three'),
  intakeSeason: requiredChoice('Choose your target intake month'),
  intakeYear: requiredChoice('Choose your target intake year'),
});

const destinationSchema = z.object({
  destinations: z
    .array(z.string())
    .min(1, 'Pick at least one destination')
    .max(5, 'Pick up to five destinations'),
});

const budgetSchema = z
  .object({
    budgetAnnualInr: z.string().min(1, 'Enter your annual budget'),
    fundingSource: requiredChoice('Choose how you plan to fund it'),
    needsScholarship: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const budget = toNumber(values.budgetAnnualInr);
    if (budget == null || budget < 100_000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['budgetAnnualInr'],
        message: 'Enter at least ₹1,00,000 per year',
      });
    }
  });

const englishSchema = z
  .object({
    englishTest: requiredChoice('Choose your English test status'),
    englishOverall: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    if (!testTakesScore(values.englishTest)) return;

    const score = toNumber(values.englishOverall);
    const { range, label } = ENGLISH_TESTS[values.englishTest];

    if (score == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['englishOverall'], message: `Enter your ${label} score` });
      return;
    }
    // Bounds mirror the server's, so a wrong score is caught before a round trip
    // rather than coming back as a field error the student has to decode.
    if (score < range[0] || score > range[1]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['englishOverall'],
        message: `${label} scores run from ${range[0]} to ${range[1]}`,
      });
    }
  });

/* ═══════════════════════════════════════════════════════════════════════════
   PATCH BUILDERS — form shape to profile shape
   ═══════════════════════════════════════════════════════════════════════════ */

const marksPatch = (values) => {
  const marks = { system: values.marksSystem, value: toNumber(values.marksValue) ?? null };
  // Which marksheet this is depends on the level: a graduate's percentage belongs
  // in tertiaryMarks, where a master's entry requirement will read it.
  return marksBasisFor(values.educationLevel) === 'tertiary'
    ? { tertiaryMarks: marks }
    : { secondaryMarks: marks };
};

export const STEPS = [
  {
    id: 'education',
    title: 'Education',
    headline: 'Where are you academically?',
    subhead: 'This decides which qualifications you can be offered — everything else builds on it.',
    schema: educationSchema,
    fields: ['educationLevel', 'stream', 'boardOrInstitution', 'marksSystem', 'marksValue', 'yearOfCompletion', 'backlogs'],
    toPatch: (values) => ({
      education: {
        level: values.educationLevel,
        stream: values.stream || null,
        boardOrInstitution: values.boardOrInstitution ?? '',
        yearOfCompletion: toNumber(values.yearOfCompletion) ?? null,
        backlogs: toNumber(values.backlogs) ?? 0,
        ...marksPatch(values),
      },
    }),
  },
  {
    id: 'goal',
    title: 'Study goal',
    headline: 'What do you want to study?',
    subhead: 'Pick the qualification and up to three subject areas. Related subjects are included automatically.',
    schema: goalSchema,
    fields: ['degreeLevel', 'fields', 'intakeSeason', 'intakeYear'],
    toPatch: (values) => ({
      goal: {
        degreeLevel: values.degreeLevel,
        fields: values.fields,
        intake: { season: values.intakeSeason, year: toNumber(values.intakeYear) ?? null },
      },
    }),
  },
  {
    id: 'destinations',
    title: 'Destinations',
    headline: 'Where would you like to study?',
    subhead: 'Choose in order of preference — your first choice scores highest.',
    schema: destinationSchema,
    fields: ['destinations'],
    toPatch: (values) => ({ destinations: values.destinations }),
  },
  {
    id: 'budget',
    title: 'Budget',
    headline: 'What can you spend each year?',
    subhead: 'Tuition and living costs together, as a family would plan it.',
    schema: budgetSchema,
    fields: ['budgetAnnualInr', 'fundingSource', 'needsScholarship'],
    toPatch: (values) => ({
      budget: {
        annualInr: toNumber(values.budgetAnnualInr) ?? null,
        fundingSource: values.fundingSource,
        needsScholarship: values.needsScholarship,
      },
    }),
  },
  {
    id: 'english',
    title: 'English test',
    headline: 'Have you taken an English test?',
    subhead: 'Scores are compared as IELTS equivalents, so any accepted test works.',
    schema: englishSchema,
    fields: ['englishTest', 'englishOverall'],
    toPatch: (values) => ({
      english: {
        test: values.englishTest,
        // A score is meaningless without a test, and the server rejects the pair —
        // so 'planned' and 'none' clear it rather than carrying a stale number.
        overall: testTakesScore(values.englishTest) ? (toNumber(values.englishOverall) ?? null) : null,
      },
    }),
  },
];

/**
 * Validates one step.
 *
 * Returns `{ ok, errors }` with errors keyed by field name, matching the shape the
 * step components already use for server-side errors — one error channel, not two.
 */
export function validateStep(stepIndex, values) {
  const step = STEPS[stepIndex];
  const picked = Object.fromEntries(step.fields.map((field) => [field, values[field]]));
  const result = step.schema.safeParse(picked);

  if (result.success) return { ok: true, errors: {} };

  return {
    ok: false,
    errors: Object.fromEntries(
      result.error.issues.map((issue) => [issue.path[0] ?? '_', issue.message])
    ),
  };
}

/** Everything the wizard would send if it saved every step at once. */
export const patchForStep = (stepIndex, values) => STEPS[stepIndex].toPatch(values);

/**
 * Seeds the form from a saved profile, for editing.
 *
 * Numbers become strings because these are text and select inputs; a controlled
 * input handed `null` warns, and handed a number refuses to be cleared.
 */
export function valuesFromProfile(profile) {
  if (!profile) return INITIAL_VALUES;

  const level = profile.education?.level ?? '';
  const marks =
    marksBasisFor(level) === 'tertiary' ? profile.education?.tertiaryMarks : profile.education?.secondaryMarks;

  const asText = (value) => (value == null ? '' : String(value));

  return {
    ...INITIAL_VALUES,
    educationLevel: level,
    stream: profile.education?.stream ?? '',
    boardOrInstitution: profile.education?.boardOrInstitution ?? '',
    marksSystem: marks?.system ?? 'percentage',
    marksValue: asText(marks?.value),
    yearOfCompletion: asText(profile.education?.yearOfCompletion),
    backlogs: asText(profile.education?.backlogs ?? 0),

    degreeLevel: profile.goal?.degreeLevel ?? '',
    fields: profile.goal?.fields ?? [],
    intakeSeason: profile.goal?.intake?.season ?? '',
    intakeYear: asText(profile.goal?.intake?.year),

    destinations: profile.destinations ?? [],

    budgetAnnualInr: asText(profile.budget?.annualInr),
    fundingSource: profile.budget?.fundingSource ?? '',
    needsScholarship: Boolean(profile.budget?.needsScholarship),

    englishTest: profile.english?.test ?? '',
    englishOverall: asText(profile.english?.overall),
  };
}
