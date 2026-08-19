/**
 * The student profile: reading it, writing it, and telling the student what to do
 * next with it.
 *
 * Completion scoring and next-step derivation live here rather than in the client
 * because both drive the recommendation engine's confidence: the same rules that
 * decide "you are 60% complete" decide which scorers fell back to partial credit.
 * Two implementations of that would drift within a week.
 */

import StudentProfile from '../models/StudentProfile.js';
import ApiError from '../utils/ApiError.js';
import { JOURNEY_STAGES } from '../constants/index.js';
import {
  degreeLevelsByRoute,
  eligibilityFor,
  eligibleDegreeLevels,
  hasEnglishScore,
  isPreClass12,
  requirementBasis,
  toPercentage,
} from './academics.js';

/**
 * Applies a validated patch onto a document, setting only leaf paths.
 *
 * Recursing to the leaves matters: assigning a whole section would wipe fields the
 * request did not mention, so editing a budget from the profile screen would
 * silently erase the English test score entered during onboarding. Arrays are
 * replaced wholesale, which is what "these are my three destinations" means.
 */
function applyPatch(doc, patch, prefix = '') {
  for (const [key, value] of Object.entries(patch)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const isPlainObject = value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

    if (isPlainObject) applyPatch(doc, value, path);
    else doc.set(path, value);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPLETION
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * The checklist behind the completion ring.
 *
 * Weights are not uniform — they are proportional to how much each answer moves a
 * recommendation. Education level and marks are worth three times a funding
 * source because they decide eligibility and academic fit, while funding source
 * only colours the advice. `step` maps each gap back to the wizard step that
 * fills it, so "Add your budget" is a link rather than a hunt.
 */
const CHECKS = [
  {
    key: 'educationLevel',
    label: 'Current education level',
    weight: 15,
    step: 1,
    hint: 'Decides which degree levels you can be offered.',
    done: (profile) => Boolean(profile.education?.level),
  },
  {
    key: 'marks',
    label: 'Latest marks',
    weight: 15,
    step: 1,
    hint: 'Scored against each course’s published entry requirement.',
    done: (profile) => {
      // Which marksheet counts depends on where the student is heading: a
      // master's applicant is judged on their degree, not on Class 12.
      const basis = requirementBasis(profile.goal?.degreeLevel ?? 'Bachelors');
      const marks = basis === 'tertiary' ? profile.education?.tertiaryMarks : profile.education?.secondaryMarks;
      return toPercentage(marks) != null;
    },
  },
  {
    key: 'stream',
    label: 'Stream or institution',
    weight: 5,
    step: 1,
    hint: 'Helps counsellors check subject prerequisites.',
    done: (profile) => Boolean(profile.education?.stream || profile.education?.boardOrInstitution),
  },
  {
    key: 'degreeLevel',
    label: 'Degree you want',
    weight: 10,
    step: 2,
    hint: 'Bachelor’s, master’s, foundation year or diploma.',
    done: (profile) => Boolean(profile.goal?.degreeLevel),
  },
  {
    key: 'fields',
    label: 'Subject areas',
    weight: 10,
    step: 2,
    hint: 'Pick up to three — related subjects are included automatically.',
    done: (profile) => Boolean(profile.goal?.fields?.length),
  },
  {
    key: 'intake',
    label: 'Target intake',
    weight: 8,
    step: 2,
    hint: 'Sets your application deadlines.',
    done: (profile) => Boolean(profile.goal?.intake?.season && profile.goal?.intake?.year),
  },
  {
    key: 'destinations',
    label: 'Destination countries',
    weight: 12,
    step: 3,
    hint: 'Ranked in the order you choose them.',
    done: (profile) => Boolean(profile.destinations?.length),
  },
  {
    key: 'budget',
    label: 'Annual budget',
    weight: 12,
    step: 4,
    hint: 'Tuition and living costs are compared against it.',
    done: (profile) => Boolean(profile.budget?.annualInr),
  },
  {
    key: 'funding',
    label: 'How you’ll fund it',
    weight: 3,
    step: 4,
    hint: 'Shapes the scholarship and loan guidance you get.',
    done: (profile) => Boolean(profile.budget?.fundingSource),
  },
  {
    key: 'english',
    label: 'English test',
    weight: 10,
    step: 5,
    hint: 'A score — or a planned test date — unlocks accurate matching.',
    done: (profile) => hasEnglishScore(profile.english) || profile.english?.test === 'planned',
  },
];

export function completionOf(profile) {
  const items = CHECKS.map((check) => ({
    key: check.key,
    label: check.label,
    weight: check.weight,
    step: check.step,
    hint: check.hint,
    done: check.done(profile),
  }));

  const earned = items.filter((item) => item.done).reduce((sum, item) => sum + item.weight, 0);
  const total = items.reduce((sum, item) => sum + item.weight, 0);

  return {
    percent: Math.round((earned / total) * 100),
    items,
    missing: items.filter((item) => !item.done),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   GUIDANCE — the answer to "I finished Class 12, now what?"
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * What this student's current qualification unlocks, in their words.
 *
 * This is the panel that makes the dashboard useful on day one, before any course
 * has been shortlisted: it names the degree levels now open, the milestone still
 * outstanding, and the concrete next actions in order.
 */
export function guidanceFor(profile) {
  const level = profile.education?.level;
  if (!level) {
    return {
      known: false,
      headline: 'Tell us where you are academically',
      note: 'Your current qualification decides which courses you can be offered — it is the first question for a reason.',
      eligibleDegreeLevels: [],
      conditionalDegreeLevels: [],
      futureDegreeLevels: [],
      milestone: null,
      preClass12: false,
      actions: [{ label: 'Start your profile', hint: '5 steps, about two minutes.', step: 1 }],
    };
  }

  const { milestone, note } = eligibilityFor(level);
  const direct = degreeLevelsByRoute(level, 'direct');
  const conditional = degreeLevelsByRoute(level, 'conditional');
  const future = degreeLevelsByRoute(level, 'future');
  const preClass12 = isPreClass12(level);

  const actions = [];
  if (milestone) {
    actions.push({
      label: `Complete your ${milestone}`,
      hint: preClass12
        ? 'Aim for the highest marks you can — direct entry and merit scholarships both key off this result.'
        : 'Your conditional offer converts to an unconditional one when this is awarded.',
      step: null,
    });
  }
  if (!hasEnglishScore(profile.english)) {
    actions.push({
      label: 'Book an IELTS or PTE test',
      hint: 'Most courses ask for IELTS 6.0–6.5. Book 3–4 months before your intake.',
      step: 5,
    });
  }
  if (!profile.destinations?.length) {
    actions.push({ label: 'Choose your destinations', hint: 'Ranked preferences sharpen every match score.', step: 3 });
  }
  if (!profile.shortlist?.length) {
    actions.push({ label: 'Shortlist 3–5 courses', hint: 'A spread of ambitious, strong and safe choices.', step: null });
  }

  return {
    known: true,
    headline: preClass12
      ? `Still in school — here is your route out of ${milestone ?? 'Class 12'}`
      : milestone
        ? 'What your current studies will open'
        : 'What your qualification opens',
    note,
    /** Admissible today. */
    eligibleDegreeLevels: direct,
    /** Admissible now, confirmed when the in-progress result lands. */
    conditionalDegreeLevels: conditional,
    /** Opens once the milestone below is complete. */
    futureDegreeLevels: future,
    milestone,
    preClass12,
    actions: actions.slice(0, 4),
  };
}

/** Where the student sits in the journey the product is built around. */
export function journeyStageOf(profile) {
  if (!profile.onboardingCompletedAt) return JOURNEY_STAGES[0]; // profile
  if (!profile.shortlist?.length) return JOURNEY_STAGES[1]; // course_discovery
  return JOURNEY_STAGES[2]; // university_shortlist
}

/* ═══════════════════════════════════════════════════════════════════════════
   SERVICE
   ═══════════════════════════════════════════════════════════════════════════ */

export const profileService = {
  /**
   * Reads a student's profile, creating an empty one on first access.
   *
   * Upsert rather than "create on registration" so that accounts predating this
   * feature — and the seeded demo student — get a profile the moment they open
   * the dashboard, with no migration to run.
   */
  async getOrCreate(userId) {
    const existing = await StudentProfile.findOne({ user: userId });
    if (existing) return existing;

    return StudentProfile.create({ user: userId });
  },

  async update(userId, patch) {
    const profile = await this.getOrCreate(userId);

    applyPatch(profile, patch);

    // Onboarding is "done" the first time the profile can actually produce
    // recommendations — education level plus an intended degree. Requiring every
    // field would leave a student who skipped the optional stream question stuck
    // in onboarding forever.
    const ready = Boolean(profile.education?.level && profile.goal?.degreeLevel);
    if (ready && !profile.onboardingCompletedAt) profile.onboardingCompletedAt = new Date();

    await profile.save();
    return profile;
  },

  /** Profile plus everything derived from it, for the dashboard and profile page. */
  async summary(userId) {
    const profile = await this.getOrCreate(userId);

    return {
      profile: profile.toJSON(),
      completion: completionOf(profile),
      guidance: guidanceFor(profile),
      journeyStage: journeyStageOf(profile),
      eligibleDegreeLevels: profile.education?.level ? eligibleDegreeLevels(profile.education.level) : [],
    };
  },

  async addToShortlist(userId, courseId) {
    const profile = await this.getOrCreate(userId);

    if (profile.shortlist.some((id) => id.equals(courseId))) {
      throw ApiError.conflict('That course is already on your shortlist');
    }
    if (profile.shortlist.length >= 20) {
      // A shortlist of everything is a shortlist of nothing; the cap exists to
      // keep the student making decisions rather than collecting tabs.
      throw ApiError.badRequest('Your shortlist is full (20 courses). Remove one to add another.');
    }

    profile.shortlist.push(courseId);
    await profile.save();
    return profile;
  },

  async removeFromShortlist(userId, courseId) {
    const profile = await this.getOrCreate(userId);
    profile.shortlist = profile.shortlist.filter((id) => !id.equals(courseId));
    await profile.save();
    return profile;
  },
};

export default profileService;
