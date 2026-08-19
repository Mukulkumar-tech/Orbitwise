import documentService from '../services/documentService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';

const actor = (req) => ({ userId: req.user._id, role: req.user.role });

export const uploadDocument = asyncHandler(async (req, res) =>
  created(
    res,
    await documentService.upload({
      studentId: req.user._id,
      type: req.body.type,
      file: req.file,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
    })
  )
);

export const getChecklist = asyncHandler(async (req, res) =>
  ok(res, await documentService.checklistFor(req.user._id))
);

/**
 * Streams a private file.
 *
 * The only route that can read stored content, and it authorizes before opening
 * the stream. Notice what is absent: any static file serving. A passport scan
 * reachable by guessing a URL is the failure this whole design exists to prevent.
 */
export const streamDocument = asyncHandler(async (req, res) => {
  const document = await documentService.authorize(req.params.id, actor(req));
  const stream = await documentService.streamFor(document);

  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Length', document.sizeBytes);
  // `inline` so the browser previews rather than force-downloads. The filename is
  // quoted and stripped of quotes/newlines, which would otherwise let a crafted
  // upload name inject extra response headers.
  const safeName = document.originalName.replace(/["\r\n]/g, '');
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  // Private: a shared proxy must never cache someone's passport.
  res.setHeader('Cache-Control', 'private, no-store');

  stream.on('error', () => res.destroy());
  stream.pipe(res);
});

export const reviewDocument = asyncHandler(async (req, res) =>
  ok(res, await documentService.review(req.params.id, req.body, actor(req)))
);

export const deleteDocument = asyncHandler(async (req, res) =>
  ok(res, await documentService.remove(req.params.id, actor(req)))
);

export const listStudentDocuments = asyncHandler(async (req, res) =>
  ok(res, await documentService.listForStudent(req.params.studentId))
);
