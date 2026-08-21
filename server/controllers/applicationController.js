import applicationService from '../services/applicationService.js';
import counsellorService from '../services/counsellorService.js';
import { ROLES } from '../constants/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';

/** The caller's identity, assembled once rather than at four call sites. */
const actor = (req) => ({ userId: req.user._id, role: req.user.role, name: req.user.name });

export const createApplication = asyncHandler(async (req, res) => {
  const { studentId: requestedStudentId, ...payload } = req.body;

  // A student's own id always wins over anything in the body, so supplying
  // someone else's studentId cannot start an application on their behalf.
  const studentId =
    req.user.role === ROLES.COUNSELLOR
      ? await counsellorService.assertOnCaseload(req.user._id, requestedStudentId)
      : req.user._id;

  return created(
    res,
    await applicationService.create({
      studentId,
      ...payload,
      actor: actor(req),
    })
  );
});

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
