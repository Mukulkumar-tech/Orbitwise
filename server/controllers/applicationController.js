import applicationService from '../services/applicationService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';

/** The caller's identity, assembled once rather than at four call sites. */
const actor = (req) => ({ userId: req.user._id, role: req.user.role, name: req.user.name });

export const createApplication = asyncHandler(async (req, res) =>
  created(res, await applicationService.create({ studentId: req.user._id, ...req.body }))
);

export const listApplications = asyncHandler(async (req, res) =>
  ok(res, await applicationService.listForStudent(req.user._id, req.query))
);

export const getApplication = asyncHandler(async (req, res) =>
  ok(res, await applicationService.getById(req.params.id, actor(req)))
);

export const transitionApplication = asyncHandler(async (req, res) =>
  ok(res, await applicationService.transition(req.params.id, req.body, actor(req)))
);

export const addApplicationNote = asyncHandler(async (req, res) =>
  ok(res, await applicationService.addNote(req.params.id, req.body, actor(req)))
);

export const getApplicationStats = asyncHandler(async (req, res) =>
  ok(res, await applicationService.statsForStudent(req.user._id))
);
