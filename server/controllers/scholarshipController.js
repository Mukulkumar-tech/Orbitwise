import scholarshipService from '../services/scholarshipService.js';
import profileService from '../services/profileService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/apiResponse.js';
import { ROLES } from '../constants/index.js';

/** The student's profile, or null for anyone who cannot have one. */
const profileOf = async (req) =>
  req.user?.role === ROLES.STUDENT ? profileService.getOrCreate(req.user._id) : null;

/**
 * One endpoint, two audiences — the same pattern the course catalogue uses.
 *
 * Anonymous visitors get the published list; a signed-in student with an
 * education level on file gets the same awards scored, ranked, and with the
 * ineligible ones separated out and explained.
 */
export const listScholarships = asyncHandler(async (req, res) => {
  const profile = await profileOf(req);

  if (profile?.education?.level) {
    const result = await scholarshipService.matchesFor(profile, req.query);
    return paginated(res, result.items, {
      page: req.query.page,
      limit: req.query.limit,
      total: result.total,
      personalized: true,
      ineligibleCount: result.ineligibleCount,
      ineligibleSample: result.ineligibleSample,
      urgentCount: result.urgentCount,
    });
  }

  const { items, total } = await scholarshipService.list(req.query);
  return paginated(res, items, { page: req.query.page, limit: req.query.limit, total, personalized: false });
});

export const getScholarship = asyncHandler(async (req, res) =>
  ok(res, await scholarshipService.bySlug(req.params.slug))
);

export const getScholarshipDeadlines = asyncHandler(async (req, res) => {
  const profile = await profileService.getOrCreate(req.user._id);
  return ok(res, await scholarshipService.upcomingDeadlines(profile));
});
