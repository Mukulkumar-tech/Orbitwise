/**
 * OrbitMatch — scores a course against a student's real profile, and explains why.
 *
 * Seven scorers, weighted to 100. Each returns its own score, a verdict and a
 * sentence a student can act on, so the number on a card is never a black box:
 * "82 · Strong match" always unpacks into "your 84% clears the 75% requirement",
 * "₹8L over your budget unless you win the merit scholarship", and so on.
 *
 *   academic      25   marks against the stated entry requirement
 *   budget        20   tuition + living against what the family can fund
 *   english       15   IELTS-equivalent against the course minimum
 *   destination   12   rank of the country in the student's own preference order
 *   course        12   subject and intended degree level
 *   intake         8   how close the course's intakes are to the target
 *   likelihood     8   selectivity of the university against profile strength
 *
 * Pure functions throughout — a profile, a course and a country in, a score out.
 * No database access, so every band boundary is testable directly.
 */

import { EDUCATION_LEVELS as EDU, matchBand } from '../constants/index.js';
import {
  admissionRoute,
  areFieldsAdjacent,
  meetsMinimumQualification,
  milestoneQualification,
  monthsToNearestIntake,
  requirementBasis,
  toIeltsEquivalent,
  toPercentage,
} from './academics.js';

export const WEIGHTS = {
  academic: 25,
  budget: 20,
  english: 15,
  destination: 12,
  course: 12,
  intake: 8,
  likelihood: 8,
};

export const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0);

/**
 * Credit given when the student simply has not told us something yet.
 *
 * Not zero, and not full. Zero would rank every course as hopeless for a student
 * who has entered three fields, which is the opposite of the encouragement a
 * half-finished profile needs; full marks would silently claim a fit nobody has
 * verified. Partial credit plus an explicit "add this to sharpen your matches"
 * keeps the score honest and points at the fix.
 */
const UNKNOWN_CREDIT = 0.55;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const lakhs = (inr) => `₹${(inr / 100_000).toFixed(1)}L`;

/**
 * Degree levels as they read mid-sentence.
 *
 * `degreeLevel.toLowerCase()` produces "not the bachelors you selected" — the kind
 * of sentence that tells a student the explanation was generated rather than
 * written.
 */
const DEGREE_PHRASE = {
  Foundation: 'foundation year',
  Certificate: 'certificate',
  Diploma: 'diploma',
  Bachelors: 'bachelor’s degree',
  Masters: 'master’s degree',
  PhD: 'PhD',
};

const phraseFor = (degreeLevel) => DEGREE_PHRASE[degreeLevel] ?? degreeLevel.toLowerCase();

/**
 * One scorer's result.
 *
 * `verdict` is what the UI colours on — 'strong' | 'fair' | 'weak' | 'unknown' —
 * so a component never re-derives thresholds the engine already applied.
 */
const scorer = (key, label, ratio, verdict, reason, { watchout = false } = {}) => ({
  key,
  label,
  score: Math.round(clamp01(ratio) * WEIGHTS[key] * 10) / 10,
  max: WEIGHTS[key],
  verdict,
  reason,
  watchout,
});

/* ═══════════════════════════════════════════════════════════════════════════
   1 · ACADEMIC FIT
   ═══════════════════════════════════════════════════════════════════════════ */

/** The marks a course judges, and the threshold it judges them against. */
function academicInputs(profile, course) {
  const basis = requirementBasis(course.degreeLevel);
  const { minSecondaryPercentage, minTertiaryPercentage } = course.requirements;

  if (basis === 'tertiary') {
    return {
      basis,
      studentPercentage: toPercentage(profile.education?.tertiaryMarks),
      required: minTertiaryPercentage ?? minSecondaryPercentage,
      label: 'degree marks',
    };
  }
  return {
    basis,
    studentPercentage: toPercentage(profile.education?.secondaryMarks),
    required: minSecondaryPercentage ?? minTertiaryPercentage,
    label: 'Class 12 marks',
  };
}

function scoreAcademic(profile, course) {
  const { studentPercentage, required, label } = academicInputs(profile, course);

  if (studentPercentage == null) {
    return scorer('academic', 'Academic fit', UNKNOWN_CREDIT, 'unknown', `Add your ${label} to score this properly.`);
  }
  if (required == null) {
    return scorer('academic', 'Academic fit', 0.8, 'fair', 'No published marks cut-off — assessed on your full application.');
  }

  const headroom = Math.round((studentPercentage - required) * 10) / 10;
  const backlogs = profile.education?.backlogs ?? 0;
  const maxBacklogs = course.requirements.maxBacklogs ?? 5;

  // Backlogs are a gate, not a gradient. A course that admits at most two
  // backlogs will not weigh a brilliant average against a third one, so the
  // score is capped rather than reduced — and says so.
  if (backlogs > maxBacklogs) {
    return scorer(
      'academic',
      'Academic fit',
      0.3,
      'weak',
      `${backlogs} backlogs against a limit of ${maxBacklogs}. Clearing them first is usually the fastest fix.`,
      { watchout: true }
    );
  }

  if (headroom >= 15) {
    return scorer('academic', 'Academic fit', 1, 'strong', `Your ${studentPercentage}% is well clear of the ${required}% requirement.`);
  }
  if (headroom >= 5) {
    return scorer('academic', 'Academic fit', 0.92, 'strong', `Your ${studentPercentage}% comfortably meets the ${required}% requirement.`);
  }
  if (headroom >= 0) {
    return scorer('academic', 'Academic fit', 0.78, 'fair', `Your ${studentPercentage}% just meets the ${required}% requirement.`);
  }
  if (headroom >= -5) {
    return scorer(
      'academic',
      'Academic fit',
      0.42,
      'fair',
      `${Math.abs(headroom)}% below the ${required}% requirement — worth applying with a strong SOP, or via a foundation year.`,
      { watchout: true }
    );
  }
  return scorer(
    'academic',
    'Academic fit',
    0.12,
    'weak',
    `Your ${studentPercentage}% is well under the ${required}% requirement.`,
    { watchout: true }
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   2 · BUDGET
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Annual cost as a family experiences it: tuition plus living, in rupees.
 *
 * Tuition alone is the number universities advertise and the number that ruins
 * financial plans — living costs are frequently half the total again.
 */
export function annualCostInr(course, country) {
  const tuition = course.tuitionPerYearInr ?? 0;
  const living = country?.livingCostPerYearInr ?? 0;
  return { tuition, living, total: tuition + living };
}

function scoreBudget(profile, course, country) {
  const budget = profile.budget?.annualInr;
  const { tuition, living, total } = annualCostInr(course, country);

  if (!budget) {
    return scorer('budget', 'Budget fit', UNKNOWN_CREDIT, 'unknown', `Set your annual budget — this course runs about ${lakhs(total)} a year including living costs.`);
  }

  const ratio = budget / total;
  const gap = total - budget;

  if (ratio >= 1.25) {
    return scorer('budget', 'Budget fit', 1, 'strong', `${lakhs(total)} a year sits well inside your ${lakhs(budget)} budget.`);
  }
  if (ratio >= 1) {
    return scorer('budget', 'Budget fit', 0.92, 'strong', `${lakhs(total)} a year fits your ${lakhs(budget)} budget.`);
  }

  // Within reach *with* the scholarship this course actually offers. Scored on
  // the discounted cost, but the reason says the discount is a condition — an
  // affordable-looking card that quietly assumed an award nobody has won yet
  // would be the single most damaging thing this engine could do.
  const award = course.scholarship?.available ? (tuition * (course.scholarship.maxPercentOfTuition ?? 0)) / 100 : 0;
  if (award > 0 && budget >= total - award) {
    return scorer(
      'budget',
      'Budget fit',
      0.72,
      'fair',
      `${lakhs(gap)} over budget at full fees, but the ${course.scholarship.maxPercentOfTuition}% scholarship would bring it within reach.`,
      { watchout: true }
    );
  }

  if (ratio >= 0.9) {
    return scorer('budget', 'Budget fit', 0.62, 'fair', `About ${lakhs(gap)} a year over your budget — often closable with a scholarship or part-time work.`, {
      watchout: true,
    });
  }
  if (ratio >= 0.75) {
    return scorer('budget', 'Budget fit', 0.38, 'weak', `${lakhs(gap)} a year over your budget (${lakhs(tuition)} tuition + ${lakhs(living)} living).`, {
      watchout: true,
    });
  }
  return scorer('budget', 'Budget fit', 0.08, 'weak', `${lakhs(total)} a year is far beyond your ${lakhs(budget)} budget.`, { watchout: true });
}

/* ═══════════════════════════════════════════════════════════════════════════
   3 · ENGLISH
   ═══════════════════════════════════════════════════════════════════════════ */

function scoreEnglish(profile, course) {
  const required = course.requirements.minIelts ?? 6.5;
  const equivalent = toIeltsEquivalent(profile.english);
  const test = profile.english?.test;

  if (equivalent == null) {
    const ratio = test === 'planned' ? 0.5 : 0.4;
    return scorer(
      'english',
      'English requirement',
      ratio,
      'unknown',
      `Needs IELTS ${required} (or equivalent). ${test === 'planned' ? 'Book your test to firm this up.' : 'No test result on file yet.'}`
    );
  }

  const diff = Math.round((equivalent - required) * 10) / 10;
  const yours = test === 'ielts' ? `IELTS ${equivalent}` : `${test.toUpperCase()} ${profile.english.overall} (IELTS ${equivalent})`;

  if (diff >= 1) return scorer('english', 'English requirement', 1, 'strong', `${yours} is comfortably above the ${required} needed.`);
  if (diff >= 0.5) return scorer('english', 'English requirement', 0.95, 'strong', `${yours} clears the ${required} requirement.`);
  if (diff >= 0) return scorer('english', 'English requirement', 0.85, 'strong', `${yours} exactly meets the ${required} requirement.`);
  if (diff >= -0.5) {
    return scorer('english', 'English requirement', 0.4, 'fair', `${yours} is half a band short of ${required} — a retake or a pre-sessional course covers it.`, {
      watchout: true,
    });
  }
  return scorer('english', 'English requirement', 0.1, 'weak', `${yours} is below the ${required} this course requires.`, { watchout: true });
}

/* ═══════════════════════════════════════════════════════════════════════════
   4 · DESTINATION
   ═══════════════════════════════════════════════════════════════════════════ */

function scoreDestination(profile, course, country) {
  const preferences = profile.destinations ?? [];
  const name = country?.name ?? course.countryCode;

  if (!preferences.length) {
    return scorer('destination', 'Destination', UNKNOWN_CREDIT, 'unknown', `No destination preference set — ${name} is included as an option.`);
  }

  const rank = preferences.indexOf(course.countryCode);
  if (rank === -1) {
    return scorer('destination', 'Destination', 0, 'weak', `${name} is outside your chosen destinations.`, { watchout: true });
  }
  if (rank === 0) return scorer('destination', 'Destination', 1, 'strong', `${name} is your first-choice destination.`);
  if (rank === 1) return scorer('destination', 'Destination', 0.86, 'strong', `${name} is your second-choice destination.`);
  return scorer('destination', 'Destination', 0.72, 'fair', `${name} is on your destination list.`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   5 · COURSE — subject and intended degree level
   ═══════════════════════════════════════════════════════════════════════════ */

function scoreCourseFit(profile, course) {
  const fields = profile.goal?.fields ?? [];
  const intended = profile.goal?.degreeLevel;

  // Subject carries 60% of this scorer and the intended level 40%. Subject leads
  // because a student who asked for a bachelor's in design is better served by a
  // design diploma than by a bachelor's in law — but the level is weighted heavily
  // enough that a course at the level they actually asked for outranks an adjacent
  // subject at the wrong one. Anything below that and "I want a bachelor's degree"
  // becomes a preference the ranking quietly ignores.
  let subjectRatio;
  let subjectReason;

  if (!fields.length) {
    subjectRatio = UNKNOWN_CREDIT;
    subjectReason = 'No subject preference set yet.';
  } else if (fields[0] === course.field) {
    subjectRatio = 1;
    subjectReason = 'Matches your first-choice subject area.';
  } else if (fields.includes(course.field)) {
    subjectRatio = 0.88;
    subjectReason = 'Matches one of your chosen subject areas.';
  } else if (fields.some((field) => areFieldsAdjacent(field, course.field))) {
    subjectRatio = 0.6;
    subjectReason = 'Closely related to your chosen subject area.';
  } else {
    subjectRatio = 0.15;
    subjectReason = 'Outside the subject areas you picked.';
  }

  let levelRatio;
  let levelReason = '';
  if (!intended) {
    levelRatio = UNKNOWN_CREDIT;
  } else if (intended === course.degreeLevel) {
    levelRatio = 1;
  } else {
    levelRatio = 0.25;
    levelReason = ` It is a ${phraseFor(course.degreeLevel)}, not the ${phraseFor(intended)} you selected.`;
  }

  const ratio = subjectRatio * 0.6 + levelRatio * 0.4;
  const verdict = ratio >= 0.85 ? 'strong' : ratio >= 0.55 ? 'fair' : 'weak';

  return scorer('course', 'Course fit', ratio, verdict, `${subjectReason}${levelReason}`, { watchout: ratio < 0.55 });
}

/* ═══════════════════════════════════════════════════════════════════════════
   6 · INTAKE TIMING
   ═══════════════════════════════════════════════════════════════════════════ */

function scoreIntake(profile, course) {
  const target = profile.goal?.intake;
  const intakes = course.intakes ?? [];

  if (!target?.season) {
    return scorer('intake', 'Intake timing', UNKNOWN_CREDIT, 'unknown', `Intakes: ${intakes.join(', ') || 'not published'}. Pick a target intake to plan deadlines.`);
  }
  if (!intakes.length) {
    return scorer('intake', 'Intake timing', 0.5, 'unknown', 'Intake months are not published for this course.');
  }

  const months = monthsToNearestIntake(target, intakes);
  const targetLabel = `${target.season}${target.year ? ` ${target.year}` : ''}`;

  if (months === 0) return scorer('intake', 'Intake timing', 1, 'strong', `Runs a ${targetLabel} intake.`);
  if (months <= 2) return scorer('intake', 'Intake timing', 0.8, 'strong', `Nearest intake is within ${months} month(s) of ${targetLabel} (${intakes.join(', ')}).`);
  if (months <= 4) return scorer('intake', 'Intake timing', 0.55, 'fair', `Nearest intake is ${months} months from ${targetLabel} (${intakes.join(', ')}).`, { watchout: true });
  return scorer('intake', 'Intake timing', 0.3, 'weak', `No intake near ${targetLabel} — this course runs ${intakes.join(', ')}.`, { watchout: true });
}

/* ═══════════════════════════════════════════════════════════════════════════
   7 · ADMISSION LIKELIHOOD
   ═══════════════════════════════════════════════════════════════════════════ */

/** Selectivity band from an acceptance rate, and its base credit. */
function selectivityBase(acceptanceRate) {
  if (acceptanceRate >= 70) return { ratio: 1, word: 'admits most qualified applicants' };
  if (acceptanceRate >= 40) return { ratio: 0.85, word: 'moderately selective' };
  if (acceptanceRate >= 15) return { ratio: 0.6, word: 'selective' };
  return { ratio: 0.35, word: 'highly selective' };
}

function scoreLikelihood(profile, course, university) {
  const rate = university?.acceptanceRate;
  if (rate == null) {
    return scorer('likelihood', 'Admission likelihood', UNKNOWN_CREDIT, 'unknown', 'This university does not publish an acceptance rate.');
  }

  const { studentPercentage, required } = academicInputs(profile, course);
  const headroom = studentPercentage != null && required != null ? studentPercentage - required : null;
  const { ratio: base, word } = selectivityBase(rate);

  // A profile above the stated bar improves the odds at a selective school; one
  // below it does the reverse. Without marks on file, selectivity alone decides.
  const adjustment = headroom == null ? 0 : headroom >= 10 ? 0.15 : headroom >= 0 ? 0.05 : -0.2;
  const ratio = clamp01(base + adjustment);

  const outlook = ratio >= 0.85 ? 'Likely' : ratio >= 0.6 ? 'Competitive' : 'Ambitious';
  const verdict = ratio >= 0.85 ? 'strong' : ratio >= 0.6 ? 'fair' : 'weak';

  return scorer('likelihood', 'Admission likelihood', ratio, verdict, `${outlook} — ${rate}% acceptance rate, ${word}.`, {
    watchout: ratio < 0.6,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   ASSEMBLY
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * How a student would be admitted to a course, or null when they could not be.
 *
 * Two gates, and the order matters. The eligibility table decides whether the
 * degree level is on this student's trajectory at all; the course's own minimum
 * qualification then decides whether an offer is available today, available
 * conditionally, or waiting on a milestone.
 *
 * The second gate is what keeps the engine honest in both directions. A Class 12
 * school-leaver is not offered a postgraduate certificate on the fiction that a
 * degree transcript is on its way — nothing is in progress, so the course drops
 * out. A student sitting Class 12 right now is offered the bachelor's degree,
 * because the qualification the course asks for is precisely the one they are
 * weeks from holding.
 */
export function resolveRoute(profile, course) {
  const level = profile.education?.level;
  if (!level) return { route: 'direct', conditional: false, note: null };

  const trajectory = admissionRoute(level, course.degreeLevel);
  if (!trajectory) return null;

  if (meetsMinimumQualification(level, course.requirements.minEducationLevel)) {
    if (trajectory === 'direct') return { route: 'direct', conditional: false, note: null };
  } else {
    // The student does not hold what the course asks for. Only the qualification
    // they are actively working towards can bridge that gap.
    const pending = milestoneQualification(level);
    if (!pending || !meetsMinimumQualification(pending, course.requirements.minEducationLevel)) return null;
  }

  const applyingNow = level === EDU.CLASS_12_PURSUING || level === EDU.BACHELORS_PURSUING;
  const route = trajectory === 'future' || !applyingNow ? 'future' : 'conditional';

  const isSchool = [EDU.CLASS_10, EDU.CLASS_11, EDU.CLASS_12_PURSUING].includes(level);

  return {
    route,
    conditional: true,
    note:
      route === 'conditional'
        ? isSchool
          ? 'Apply now with predicted grades — the offer is confirmed when your Class 12 result arrives.'
          : 'Apply in your final year — the offer is confirmed when your degree is awarded.'
        : isSchool
          ? 'Opens once you complete Class 12. Worth planning for now: the English test and shortlist take months.'
          : 'Opens once your current qualification is awarded.',
  };
}

/**
 * Scores one course. Returns null when the student is not eligible at all, so
 * callers can filter and score in a single pass.
 *
 * `country` and `university` are passed in rather than populated here: ranking a
 * few hundred courses would otherwise issue a few hundred lookups for the eight
 * countries they share.
 */
export function scoreCourse(profile, course, { country, university } = {}) {
  const eligibility = resolveRoute(profile, course);
  if (!eligibility) return null;

  const breakdown = [
    scoreAcademic(profile, course),
    scoreBudget(profile, course, country),
    scoreEnglish(profile, course),
    scoreDestination(profile, course, country),
    scoreCourseFit(profile, course),
    scoreIntake(profile, course),
    scoreLikelihood(profile, course, university ?? course.university),
  ];

  const raw = breakdown.reduce((sum, item) => sum + item.score, 0);
  const score = Math.round((raw / TOTAL_WEIGHT) * 100);
  const band = matchBand(score);
  const costs = annualCostInr(course, country);

  return {
    score,
    band: band.key,
    bandLabel: band.label,
    route: eligibility.route,
    conditional: eligibility.conditional,
    conditionalNote: eligibility.note,
    breakdown,
    /** The two or three sentences worth putting on a card, in priority order. */
    strengths: breakdown.filter((item) => item.verdict === 'strong').map((item) => item.reason),
    watchouts: breakdown.filter((item) => item.watchout).map((item) => item.reason),
    /** What the student still has to tell us before this score can be trusted. */
    unknowns: breakdown.filter((item) => item.verdict === 'unknown').map((item) => item.label),
    costs: {
      ...costs,
      /** Positive when the annual cost exceeds the stated budget. */
      gap: profile.budget?.annualInr ? Math.max(0, costs.total - profile.budget.annualInr) : null,
    },
  };
}

/**
 * Scores and ranks a set of courses.
 *
 * Ties break on cost, ascending: two equally-good matches are not equally good
 * decisions, and the cheaper one is the better default for the student.
 */
export function rankCourses(profile, courses, { countriesByCode = new Map(), limit } = {}) {
  const ranked = courses
    .map((course) => {
      const country = countriesByCode.get(course.countryCode);
      const match = scoreCourse(profile, course, { country, university: course.university });
      return match ? { course, match } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.match.score - a.match.score || a.match.costs.total - b.match.costs.total);

  return limit ? ranked.slice(0, limit) : ranked;
}

export default { WEIGHTS, TOTAL_WEIGHT, scoreCourse, rankCourses, resolveRoute, annualCostInr };
