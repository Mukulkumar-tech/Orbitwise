import Scholarship from '../models/Scholarship.js';
import ApiError from '../utils/ApiError.js';
import { eligibleDegreeLevels, requirementBasis, toIeltsEquivalent, toPercentage } from './academics.js';

/**
 * Scholarship discovery and matching.
 *
 * Mirrors the course engine's philosophy deliberately: degree level and a passed
 * deadline are **hard gates**, everything else is a graded score with stated
 * reasons. A Class 12 student shown a master's-only award — even at 40% — has been
 * given a false hope, and the platform's whole claim is that it does not do that.
 *
 * Marks and English are scored rather than gated, because a near miss is
 * actionable: "you need 75%, you have 72%" tells a student something useful,
 * where silence tells them nothing.
 */

const DAY = 86_400_000;

/** Marks relevant to this award's level: Class 12 for UG, degree marks for PG. */
const relevantPercentage = (profile, degreeLevels = []) => {
  const level = degreeLevels[0] ?? 'Bachelors';
  const basis = requirementBasis(level);
  const marks = basis === 'tertiary' ? profile.education?.tertiaryMarks : profile.education?.secondaryMarks;
  return toPercentage(marks);
};

/**
 * Scores one scholarship against a profile.
 *
 * Returns `eligible: false` with a reason rather than a low score when a hard
 * gate fails, so the caller can exclude it instead of ranking it.
 */
function scoreScholarship(profile, scholarship) {
  const reasons = [];
  const gaps = [];

  // ─── Hard gate 1: degree level ─────────────────────────────────────────
  const reachable = eligibleDegreeLevels(profile.education?.level);
  const levels = scholarship.eligibility?.degreeLevels ?? [];
  if (levels.length && !levels.some((level) => reachable.includes(level))) {
    return { eligible: false, blockedBy: 'level', reason: `Open to ${levels.join(', ')} only` };
  }

  // ─── Hard gate 2: deadline ─────────────────────────────────────────────
  const daysRemaining = scholarship.deadline
    ? Math.ceil((new Date(scholarship.deadline).getTime() - Date.now()) / DAY)
    : null;
  if (daysRemaining != null && daysRemaining < 0) {
    return { eligible: false, blockedBy: 'deadline', reason: 'The deadline for this award has passed' };
  }

  let score = 0;
  let possible = 0;

  // ─── Academic (35) ─────────────────────────────────────────────────────
  possible += 35;
  const required = scholarship.eligibility?.minPercentage;
  const actual = relevantPercentage(profile, levels);
  if (required == null) {
    score += 28;
    reasons.push('No published marks threshold');
  } else if (actual == null) {
    score += 17;
    gaps.push(`Needs ${required}% — add your marks to check this`);
  } else if (actual >= required) {
    score += 35;
    reasons.push(`Your ${actual}% clears the ${required}% requirement`);
  } else if (actual >= required - 5) {
    // Within five points is worth surfacing: a re-evaluated grade or a strong
    // application can close a gap that small.
    score += 18;
    gaps.push(`Needs ${required}% — you have ${actual}%, close but short`);
  } else {
    score += 4;
    gaps.push(`Needs ${required}% — you have ${actual}%`);
  }

  // ─── English (20) ──────────────────────────────────────────────────────
  possible += 20;
  const minIelts = scholarship.eligibility?.minIelts;
  const ielts = toIeltsEquivalent(profile.english);
  if (minIelts == null) {
    score += 16;
  } else if (ielts == null) {
    score += 8;
    gaps.push(`Needs IELTS ${minIelts} — no test result on file yet`);
  } else if (ielts >= minIelts) {
    score += 20;
    reasons.push(`Your IELTS ${ielts} meets the ${minIelts} requirement`);
  } else {
    score += 5;
    gaps.push(`Needs IELTS ${minIelts} — you have ${ielts}`);
  }

  // ─── Subject fit (20) ──────────────────────────────────────────────────
  possible += 20;
  const awardFields = scholarship.eligibility?.fields ?? [];
  const wanted = profile.goal?.fields ?? [];
  if (!awardFields.length) {
    score += 15;
    reasons.push('Open to all subjects');
  } else if (wanted.some((field) => awardFields.includes(field))) {
    score += 20;
    reasons.push('Covers your preferred subject');
  } else if (!wanted.length) {
    score += 10;
  } else {
    score += 3;
    gaps.push('Restricted to other subjects');
  }

  // ─── Destination fit (15) ──────────────────────────────────────────────
  possible += 15;
  const destinations = profile.destinations ?? [];
  if (!scholarship.countryCode) {
    score += 11;
  } else if (!destinations.length) {
    score += 9;
  } else if (destinations.includes(scholarship.countryCode)) {
    score += 15;
    reasons.push(`In ${scholarship.countryName || scholarship.countryCode}, one of your preferred destinations`);
  } else {
    score += 3;
    gaps.push(`Only for study in ${scholarship.countryName || scholarship.countryCode}`);
  }

  // ─── Urgency (10) ──────────────────────────────────────────────────────
  // Rewards awards a student can still realistically prepare for. An award
  // closing in three days scores lower than one closing in three months, because
  // recommending the former as a "top match" would be setting them up to fail.
  possible += 10;
  if (daysRemaining == null) {
    score += 8;
    if (scholarship.automatic) reasons.push('Awarded automatically with your offer — no separate application');
  } else if (daysRemaining >= 45) {
    score += 10;
    reasons.push(`${daysRemaining} days to apply`);
  } else if (daysRemaining >= 14) {
    score += 7;
    gaps.push(`Closes in ${daysRemaining} days — start now`);
  } else {
    score += 3;
    gaps.push(`Closes in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`);
  }

  if (scholarship.eligibility?.needsFinancialNeed) {
    gaps.push('Requires proof of financial need');
  }

  return {
    eligible: true,
    score: Math.round((score / possible) * 100),
    reasons,
    gaps,
    daysRemaining,
    urgent: daysRemaining != null && daysRemaining <= 30,
  };
}

/**
 * Adds `daysRemaining` to a lean document.
 *
 * The model exposes this as a virtual, but `.lean()` drops virtuals unless the
 * mongoose-lean-virtuals plugin is installed — and passing `{ virtuals: true }`
 * without it fails silently, leaving the field simply absent. Computing it here
 * keeps the lean read and makes the value's presence guaranteed.
 */
const withDeadlineInfo = (scholarship) => ({
  ...scholarship,
  daysRemaining: scholarship.deadline
    ? Math.ceil((new Date(scholarship.deadline).getTime() - Date.now()) / DAY)
    : null,
});

/** Filter shared by the public list and the matched list. */
const baseFilter = ({ countryCode, degreeLevel, field } = {}) => ({
  isActive: true,
  ...(countryCode ? { countryCode } : {}),
  ...(degreeLevel ? { 'eligibility.degreeLevels': degreeLevel } : {}),
  ...(field ? { 'eligibility.fields': field } : {}),
});

export const scholarshipService = {
  /**
   * Public catalogue, unscored.
   *
   * Sorted by deadline with open-ended awards last: an award closing in nine days
   * is more useful at the top of a list than one with no deadline at all.
   */
  async list(query = {}) {
    const { page = 1, limit = 12 } = query;
    const filter = baseFilter(query);

    const [items, total] = await Promise.all([
      // An aggregation rather than a plain sort, because MongoDB orders `null`
      // *before* real dates ascending — so a simple `sort({ deadline: 1 })` puts
      // every open-ended award above the one closing in nine days, which is
      // exactly backwards for a page about urgency. `hasDeadline` forces dated
      // awards first, soonest at the top, with undated ones after.
      Scholarship.aggregate([
        { $match: filter },
        { $addFields: { hasDeadline: { $cond: [{ $ifNull: ['$deadline', false] }, 0, 1] } } },
        { $sort: { hasDeadline: 1, deadline: 1, 'award.amountInr': -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        { $project: { hasDeadline: 0 } },
      ]),
      Scholarship.countDocuments(filter),
    ]);

    return { items: items.map(withDeadlineInfo), total };
  },

  async bySlug(slug) {
    const scholarship = await Scholarship.findOne({ slug, isActive: true }).lean();
    if (!scholarship) throw ApiError.notFound('That scholarship could not be found');
    return withDeadlineInfo(scholarship);
  },

  /**
   * Scored, ranked awards for one student.
   *
   * Ineligible awards are returned separately rather than dropped silently, so
   * the UI can explain *why* something is out of reach — "master's only", "deadline
   * passed" — instead of leaving a student wondering what they are not being shown.
   */
  async matchesFor(profile, query = {}) {
    const { page = 1, limit = 12 } = query;
    const candidates = await Scholarship.find(baseFilter(query)).limit(400).lean();

    const scored = [];
    const ineligible = [];

    for (const scholarship of candidates) {
      const match = scoreScholarship(profile, scholarship);
      if (match.eligible) scored.push({ ...scholarship, match });
      else ineligible.push({ ...scholarship, match });
    }

    scored.sort((a, b) => b.match.score - a.match.score || (a.match.daysRemaining ?? 9999) - (b.match.daysRemaining ?? 9999));

    return {
      items: scored.slice((page - 1) * limit, page * limit),
      total: scored.length,
      ineligibleCount: ineligible.length,
      /** A short sample, enough to explain the exclusions without a second page. */
      ineligibleSample: ineligible.slice(0, 4).map((entry) => ({
        name: entry.name,
        provider: entry.provider,
        slug: entry.slug,
        reason: entry.match.reason,
      })),
      urgentCount: scored.filter((entry) => entry.match.urgent).length,
    };
  },

  /** Awards closing soonest, for the dashboard deadline tracker. */
  async upcomingDeadlines(profile, { withinDays = 60, limit = 5 } = {}) {
    const horizon = new Date(Date.now() + withinDays * DAY);
    const candidates = await Scholarship.find({
      isActive: true,
      deadline: { $gte: new Date(), $lte: horizon },
    })
      .sort({ deadline: 1 })
      .limit(60)
      .lean();

    return candidates
      .map((scholarship) => ({ scholarship, match: scoreScholarship(profile, scholarship) }))
      .filter((entry) => entry.match.eligible)
      .slice(0, limit)
      .map(({ scholarship, match }) => ({
        slug: scholarship.slug,
        name: scholarship.name,
        provider: scholarship.provider,
        deadline: scholarship.deadline,
        daysRemaining: match.daysRemaining,
        score: match.score,
      }));
  },
};

export { scoreScholarship };
export default scholarshipService;
