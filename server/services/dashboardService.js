/**
 * Assembles the student dashboard in one round trip.
 *
 * A dashboard that fired six requests would render in six stages, each shifting
 * the layout under the student. One endpoint, one payload, one paint — and the
 * pieces are still independent services underneath, so the courses page reuses
 * `recommendations` without inheriting anything dashboard-shaped.
 */

import profileService, { completionOf, guidanceFor, journeyStageOf } from './profileService.js';
import catalogueService from './catalogueService.js';
import { eligibleDegreeLevels } from './academics.js';

/** How many matches the dashboard shows before "see all". */
const TOP_MATCHES = 6;

const average = (values) => (values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : null);

export const dashboardService = {
  async forStudent(userId) {
    const profile = await profileService.getOrCreate(userId);

    const base = {
      profile: profile.toJSON(),
      completion: completionOf(profile),
      guidance: guidanceFor(profile),
      journeyStage: journeyStageOf(profile),
      eligibleDegreeLevels: profile.education?.level ? eligibleDegreeLevels(profile.education.level) : [],
    };

    // No education level means nothing can be scored honestly, so the dashboard
    // asks for it rather than showing an arbitrary list of courses. The catalogue
    // counts still come back — "1,200 courses are waiting" is a better prompt to
    // finish onboarding than an empty screen.
    if (!profile.education?.level) {
      const stats = await catalogueService.reachStats(profile);
      return { ...base, stats, matches: [], shortlist: [], insights: null };
    }

    const [recommendations, stats, shortlist] = await Promise.all([
      catalogueService.recommendations(profile, { limit: TOP_MATCHES }),
      catalogueService.reachStats(profile),
      catalogueService.shortlistFor(profile),
    ]);

    const matches = recommendations.items;

    return {
      ...base,
      stats: { ...stats, matchingCourses: recommendations.total, shortlisted: shortlist.length },
      matches,
      shortlist,
      insights: {
        bestScore: matches[0]?.match.score ?? null,
        bestBand: matches[0]?.match.band ?? null,
        /**
         * How much of the top match rested on real answers, 0–1.
         *
         * Sent so the dashboard can decline to headline a number built mostly
         * from fallback credit. Without it the tile reads "70/100 Possible
         * match" to a student who has answered one question.
         */
        bestConfidence: matches[0]?.match.confidence ?? null,
        /** Typical annual cost across the top matches — the planning number. */
        typicalAnnualCostInr: average(matches.map((item) => item.match.costs.total)),
        /** How many of the top matches need no conditional offer. */
        directOffers: matches.filter((item) => !item.match.conditional).length,
        /** Scorers still running on partial credit, deduplicated across matches. */
        unknowns: [...new Set(matches.flatMap((item) => item.match.unknowns))],
      },
    };
  },
};

export default dashboardService;
