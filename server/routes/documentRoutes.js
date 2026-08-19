import { Router } from 'express';

import * as documentController from '../controllers/documentController.js';
import validate from '../middleware/validate.js';
import handleUpload from '../middleware/upload.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';
import { ROLES } from '../constants/index.js';
import {
  documentIdParam,
  reviewDocumentSchema,
  studentIdParam,
  uploadDocumentSchema,
} from '../validators/documentValidators.js';

const router = Router();

router.use(protect);

/** The student's own checklist — what is held, what is still outstanding. */
router.get('/checklist', authorize(ROLES.STUDENT), documentController.getChecklist);

/**
 * Upload. `handleUpload` runs before validation because the multipart body does
 * not exist until multer has parsed it — `req.body.type` is unreadable otherwise.
 */
router.post(
  '/',
  authorize(ROLES.STUDENT),
  uploadLimiter,
  handleUpload,
  validate({ body: uploadDocumentSchema }),
  documentController.uploadDocument
);

/**
 * The only route that returns file content. Authorization happens in the service,
 * before the stream opens.
 */
router.get('/:id/file', validate({ params: documentIdParam }), documentController.streamDocument);

router.patch(
  '/:id/review',
  authorize(ROLES.COUNSELLOR, ROLES.ADMIN),
  validate({ params: documentIdParam, body: reviewDocumentSchema }),
  documentController.reviewDocument
);

router.delete('/:id', validate({ params: documentIdParam }), documentController.deleteDocument);

/** Staff view of one student's documents. */
router.get(
  '/student/:studentId',
  authorize(ROLES.COUNSELLOR, ROLES.ADMIN),
  validate({ params: studentIdParam }),
  documentController.listStudentDocuments
);

export default router;
