/**
 * Pure academic arithmetic and eligibility rules.
 *
 * Everything here is a total function of its arguments — no database, no HTTP, no
 * dates read from the clock unless passed in. That is deliberate: these rules
 * decide what a student is allowed to be shown, so they need to be unit-testable
 * at their boundaries rather than only observable through an endpoint.
 *
 * Imported by both matchService (scoring) and profileService (guidance), so a
 * rule like "Class 12 in progress reaches a conditional bachelor's offer" is
 * written exactly once.
 */

import { DEGREE_LEVELS, EDUCATION_LEVELS as EDU } from '../constants/index.js';

/* ═══════════════════════════════════════════════════════════════════════════
   MARKS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Normalizes marks to a percentage, the notation every course requirement uses.
 *
 * The CGPA conversions are the ones Indian universities and foreign admissions
 * offices actually apply — CGPA × 9.5 for a CBSE 10-point scale, and the common
 * 4.0-GPA table — rather than a naive linear stretch to 100. A naive conversion
 * would inflate a 7.0 CGPA to 70% instead of 66.5%, which is the difference
 * between clearing a 70% entry requirement and not.
 */
export function toPercentage({ system = 'percentage', value } = {}) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const marks = Number(value);

  if (system === 'cgpa_10') return round1(Math.min(marks * 9.5, 100));
  if (system === 'gpa_4') return round1(Math.min((marks / 4) * 100, 100));
  return round1(Math.min(marks, 100));
}

const round1 = (value) => Math.round(value * 10) / 10;

/* ═══════════════════════════════════════════════════════════════════════════
   ENGLISH TESTS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * IELTS-equivalent bands for the other accepted tests.
 *
 * Courses store one requirement (`minIelts`) and every test is compared against
 * it, so adding a test is a row here rather than a column on every course. The
 * mappings follow the published concordances used in admissions.
 */
const IELTS_EQUIVALENT = {
  ielts: (score) => score,
  // PTE Academic: 50→6.0, 58→6.5, 65→7.0, 73→7.5 — ~15 PTE points per band.
  pte: (score) => 6 + (score - 50) / 15,
  // TOEFL iBT: 60→6.0, 79→6.5, 94→7.0, 102→7.5.
  toefl: (score) => {
    if (score >= 102) return 7.5 + (score - 102) / 12;
    if (score >= 94) return 7 + ((score - 94) / 8) * 0.5;
    if (score >= 79) return 6.5 + ((score - 79) / 15) * 0.5;
    if (score >= 60) return 6 + ((score - 60) / 19) * 0.5;
    return (score / 60) * 6;
  },
  // Duolingo English Test: 95→6.0, 105→6.5, 120→7.0.
  duolingo: (score) => 6 + ((score - 95) / 25) * 1,
};

/** IELTS-equivalent overall band, or null when no test has been taken yet. */
export function toIeltsEquivalent({ test, overall } = {}) {
  const convert = IELTS_EQUIVALENT[test];
  if (!convert || overall == null || Number.isNaN(Number(overall))) return null;
  const band = convert(Number(overall));
  // Half-band rounding, the granularity IELTS itself reports.
  return Math.max(0, Math.min(9, Math.round(band * 2) / 2));
}

/** True when the student has a usable test result rather than an intention. */
export const hasEnglishScore = (english) => toIeltsEquivalent(english) != null;

/* ═══════════════════════════════════════════════════════════════════════════
   ELIGIBILITY
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Which degree levels each education level can be offered, and on what terms.
 *
 * `conditional` levels are real options that resolve later: a student in Class 12
 * gets a conditional bachelor's offer against predicted grades and confirms it
 * with their marksheet. Hiding those until results day would empty the dashboard
 * of exactly the students who most need to plan — which is the whole point of
 * this table existing rather than a single `>=` comparison.
 *
 * `milestone` is the qualification the student must finish before an offer can be
 * confirmed; null when nothing is outstanding.
 */
const ELIGIBILITY = {
  [EDU.CLASS_10]: {
    routes: { Foundation: 'direct', Certificate: 'future', Diploma: 'future', Bachelors: 'future' },
    milestone: 'Class 12',
    note: 'A foundation year is the standard bridge from school into an overseas bachelor’s degree. Finish Class 12 first where you can — it opens direct entry and far better scholarships.',
  },
  [EDU.CLASS_11]: {
    routes: { Foundation: 'direct', Certificate: 'future', Diploma: 'future', Bachelors: 'future' },
    milestone: 'Class 12',
    note: 'You apply during Class 12, so this year is for shortlisting and for your English test. Everything below is what your Class 12 result will unlock.',
  },
  [EDU.CLASS_12_PURSUING]: {
    routes: { Foundation: 'direct', Certificate: 'conditional', Diploma: 'conditional', Bachelors: 'conditional' },
    milestone: 'Class 12',
    note: 'This is exactly the right time to apply. Predicted grades secure a conditional offer, and your marksheet converts it to an unconditional one.',
  },
  [EDU.CLASS_12]: {
    routes: { Foundation: 'direct', Certificate: 'direct', Diploma: 'direct', Bachelors: 'direct' },
    milestone: null,
    note: 'Class 12 complete means direct entry to bachelor’s degrees. Where your marks fall short of a university’s cut-off, its foundation year is the route in.',
  },
  [EDU.DIPLOMA]: {
    routes: { Certificate: 'direct', Diploma: 'direct', Bachelors: 'direct' },
    milestone: null,
    note: 'A recognised diploma often earns credit transfer — many universities admit you straight into second year, cutting a year of tuition.',
  },
  [EDU.BACHELORS_PURSUING]: {
    routes: { Certificate: 'direct', Diploma: 'direct', Masters: 'conditional' },
    milestone: 'Bachelor’s degree',
    note: 'Apply in your final year. A conditional master’s offer is confirmed once your degree certificate and final transcript are issued.',
  },
  [EDU.BACHELORS]: {
    routes: { Certificate: 'direct', Diploma: 'direct', Masters: 'direct' },
    milestone: null,
    note: 'A completed bachelor’s degree opens master’s admission. A PhD additionally needs a master’s or a strong research record.',
  },
  [EDU.MASTERS]: {
    routes: { Certificate: 'direct', Masters: 'direct', PhD: 'direct' },
    milestone: null,
    note: 'With a master’s in hand you can pursue a PhD, or a second master’s to switch specialisation.',
  },
};

/** The eligibility row for an education level, with a safe default. */
export const eligibilityFor = (educationLevel) => ELIGIBILITY[educationLevel] ?? ELIGIBILITY[EDU.CLASS_12];

/**
 * The qualification a student is currently working towards, if any.
 *
 * This is what separates "conditional offer" from "wishful thinking": a course
 * asking for Class 12 can make an offer to someone sitting Class 12 now, and
 * cannot make one to someone who finished Class 12 years ago without it. Returns
 * null when nothing is in progress.
 */
export const milestoneQualification = (educationLevel) =>
  ({
    [EDU.CLASS_10]: EDU.CLASS_12,
    [EDU.CLASS_11]: EDU.CLASS_12,
    [EDU.CLASS_12_PURSUING]: EDU.CLASS_12,
    [EDU.BACHELORS_PURSUING]: EDU.BACHELORS,
  })[educationLevel] ?? null;

/**
 * Ordinal rank of each education level, for "has the student got at least X?"
 * comparisons against a course's stated minimum qualification.
 *
 * A level in progress ranks *below* the completed one it leads to, which is what
 * turns "Bachelors required, student is in their final year" into a conditional
 * offer rather than a rejection.
 */
export const EDUCATION_RANK = {
  [EDU.CLASS_10]: 0,
  [EDU.CLASS_11]: 1,
  [EDU.CLASS_12_PURSUING]: 2,
  [EDU.CLASS_12]: 3,
  [EDU.DIPLOMA]: 4,
  [EDU.BACHELORS_PURSUING]: 5,
  [EDU.BACHELORS]: 6,
  [EDU.MASTERS]: 7,
};

/** True when the student already holds the qualification a course asks for. */
export const meetsMinimumQualification = (educationLevel, minEducationLevel) =>
  (EDUCATION_RANK[educationLevel] ?? -1) >= (EDUCATION_RANK[minEducationLevel] ?? 0);

/**
 * Every degree level a student can be shown — including the ones their current
 * studies will unlock rather than only the ones already open.
 *
 * That inclusion is the answer to "I'm in Class 11, what can I even do?": the
 * bachelor's degrees they will be eligible for are the entire point of planning
 * now, and a list restricted to what they hold today would be one foundation year.
 */
export const eligibleDegreeLevels = (educationLevel) =>
  // Sorted by DEGREE_LEVELS order so the client can render them in academic
  // sequence without re-sorting a list it did not build.
  Object.keys(eligibilityFor(educationLevel).routes).sort(
    (a, b) => DEGREE_LEVELS.indexOf(a) - DEGREE_LEVELS.indexOf(b)
  );

/** Degree levels reachable by a given route, for the guidance panel. */
export const degreeLevelsByRoute = (educationLevel, route) =>
  Object.entries(eligibilityFor(educationLevel).routes)
    .filter(([, value]) => value === route)
    .map(([level]) => level)
    .sort((a, b) => DEGREE_LEVELS.indexOf(a) - DEGREE_LEVELS.indexOf(b));

/**
 * How a student reaches a given degree level:
 *
 *   'direct'      admissible today
 *   'conditional' admissible now, confirmed when the in-progress result lands
 *   'future'      opens once the current milestone is complete
 *   null          not reachable from here at all
 *
 * Four states rather than a boolean is what lets a card say "opens after Class 12"
 * instead of silently disappearing — and what stops a Class 12 school-leaver being
 * shown postgraduate certificates as though a marksheet were on its way.
 */
export function admissionRoute(educationLevel, degreeLevel) {
  return eligibilityFor(educationLevel).routes[degreeLevel] ?? null;
}

export const isEligibleFor = (educationLevel, degreeLevel) => admissionRoute(educationLevel, degreeLevel) != null;

/** True when the student is still in school — drives the pre-Class-12 guidance. */
export const isPreClass12 = (educationLevel) =>
  [EDU.CLASS_10, EDU.CLASS_11, EDU.CLASS_12_PURSUING].includes(educationLevel);

/**
 * Which qualification's marks a course requirement should be read against.
 *
 * A master's course cares about degree marks; a bachelor's course cares about
 * Class 12. A student who has finished a bachelor's degree still has Class 12
 * marks on file, and comparing those against a master's cut-off would be
 * meaningless — hence the split rather than one `marks` field.
 */
export const requirementBasis = (degreeLevel) =>
  ['Masters', 'PhD'].includes(degreeLevel) ? 'tertiary' : 'secondary';

/* ═══════════════════════════════════════════════════════════════════════════
   FIELDS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Neighbouring subject areas.
 *
 * A student who asks for computer science and is shown only computer science
 * misses data analytics, which is the same career with a different name on the
 * certificate. Adjacency scores partial credit rather than full, so a direct hit
 * always outranks a neighbour.
 */
const FIELD_ADJACENCY = {
  computer_science: ['data_analytics', 'engineering', 'design'],
  engineering: ['computer_science', 'environment', 'design'],
  business: ['data_analytics', 'law', 'hospitality', 'media'],
  data_analytics: ['computer_science', 'business'],
  health_sciences: ['life_sciences'],
  life_sciences: ['health_sciences', 'environment'],
  design: ['media', 'computer_science'],
  law: ['business'],
  media: ['design', 'business'],
  hospitality: ['business'],
  education: ['media'],
  environment: ['life_sciences', 'engineering'],
};

export const areFieldsAdjacent = (a, b) => Boolean(FIELD_ADJACENCY[a]?.includes(b));

/**
 * A student's chosen fields plus their neighbours.
 *
 * Used to widen the candidate query, not to score it: the recommendation list
 * includes adjacent subjects so they can be discovered, and the field scorer then
 * ranks them below a direct hit.
 */
export const expandFields = (fields = []) => [
  ...new Set(fields.flatMap((field) => [field, ...(FIELD_ADJACENCY[field] ?? [])])),
];

/* ═══════════════════════════════════════════════════════════════════════════
   INTAKES
   ═══════════════════════════════════════════════════════════════════════════ */

const MONTH_INDEX = {
  January: 0,
  February: 1,
  March: 2,
  April: 3,
  May: 4,
  June: 5,
  July: 6,
  August: 7,
  September: 8,
  October: 9,
  November: 10,
  December: 11,
};

/** Months from the target intake to the nearest intake a course offers. */
export function monthsToNearestIntake(target, courseIntakes = []) {
  if (!target?.season || !courseIntakes.length) return null;
  const targetIndex = MONTH_INDEX[target.season];
  if (targetIndex == null) return null;

  return Math.min(
    ...courseIntakes
      .map((season) => MONTH_INDEX[season])
      .filter((index) => index != null)
      // Distance measured on a 12-month circle: a January target and an October
      // intake are three months apart, not nine.
      .map((index) => {
        const gap = Math.abs(index - targetIndex);
        return Math.min(gap, 12 - gap);
      })
  );
}
