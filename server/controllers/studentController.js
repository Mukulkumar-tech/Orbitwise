import profileService from '../services/profileService.js';
import catalogueService from '../services/catalogueService.js';
import dashboardService from '../services/dashboardService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/apiResponse.js';

/**
 * The student portal's own endpoints. Every one is scoped to `req.user._id` —
 * there is no `:studentId` anywhere in this controller, so one student cannot
 * read another's profile even by guessing an id. Counsellor access to a student's
 * profile is a separate, explicitly authorized route in Phase 12.
 */

export const getProfile = asyncHandler(async (req, res) => ok(res, await profileService.summary(req.user._id)));

export const updateProfile = asyncHandler(async (req, res) => {
  await profileService.update(req.user._id, req.body);
  // The full summary, not just the saved fields: a wizard step that changes the
  // education level changes eligibility, completion and guidance too, and the
  // client should never have to recompute any of that to stay in sync.
  return ok(res, await profileService.summary(req.user._id));
});

export const getDashboard = asyncHandler(async (req, res) => ok(res, await dashboardService.forStudent(req.user._id)));

export const getRecommendations = asyncHandler(async (req, res) => {
  const profile = await profileService.getOrCreate(req.user._id);
  const { items, total, capped } = await catalogueService.recommendations(profile, req.query);

  return paginated(res, items, { page: req.query.page, limit: req.query.limit, total, capped });
});

export const getShortlist = asyncHandler(async (req, res) => {
  const profile = await profileService.getOrCreate(req.user._id);
  return ok(res, await catalogueService.shortlistFor(profile));
});

export const addToShortlist = asyncHandler(async (req, res) => {
  const profile = await profileService.addToShortlist(req.user._id, req.params.courseId);
  return ok(res, { shortlist: profile.shortlist, count: profile.shortlist.length });
});

export const removeFromShortlist = asyncHandler(async (req, res) => {
  const profile = await profileService.removeFromShortlist(req.user._id, req.params.courseId);
  return ok(res, { shortlist: profile.shortlist, count: profile.shortlist.length });
});
