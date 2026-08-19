import catalogueService from '../services/catalogueService.js';
import profileService from '../services/profileService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/apiResponse.js';
import { ROLES } from '../constants/index.js';

/**
 * Catalogue reads — countries, universities, courses and the wizard's option sets.
 *
 * These routes run behind `optionalAuth`, so each one serves two audiences from
 * one implementation: an anonymous visitor gets catalogue data, and a signed-in
 * student gets the same data with their match score attached. Duplicating them as
 * public and private variants would guarantee the two drift.
 */

/** The student's profile, or null for anyone who cannot have one. */
const profileOf = async (req) =>
  req.user?.role === ROLES.STUDENT ? profileService.getOrCreate(req.user._id) : null;

export const getOptions = asyncHandler(async (_req, res) => ok(res, await catalogueService.options()));

export const listCountries = asyncHandler(async (_req, res) => ok(res, await catalogueService.listCountries()));

export const listUniversities = asyncHandler(async (req, res) => {
  const { items, total } = await catalogueService.listUniversities(req.query);
  return paginated(res, items, { page: req.query.page, limit: req.query.limit, total });
});

export const listCourses = asyncHandler(async (req, res) => {
  const profile = await profileOf(req);

  // A student with an education level on file gets ranked recommendations from the
  // same endpoint; everyone else gets the plain catalogue. The alternative — a
  // "browse" list that ignores a profile the server already holds — would show a
  // signed-in student courses they cannot be admitted to.
  const result = profile?.education?.level
    ? await catalogueService.recommendations(profile, req.query)
    : await catalogueService.listCourses(req.query);

  return paginated(res, result.items, {
    page: req.query.page,
    limit: req.query.limit,
    total: result.total,
    ...(result.capped ? { capped: true } : {}),
    personalized: Boolean(profile?.education?.level),
  });
});

export const getCourse = asyncHandler(async (req, res) =>
  ok(res, await catalogueService.courseBySlug(req.params.slug, await profileOf(req)))
);
