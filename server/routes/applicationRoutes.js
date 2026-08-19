import { Router } from 'express';

import * as applicationController from '../controllers/applicationController.js';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';
import {
  applicationIdParam,
  applicationListQuery,
  createApplicationSchema,
  noteSchema,
  transitionSchema,
} from '../validators/applicationValidators.js';

const router = Router();

// Authenticated by default. Individual routes widen to counsellors where the
// service enforces assignment; ownership is always checked in the service, never
// inferred from the route shape.
router.use(protect);

router.get('/stats', authorize(ROLES.STUDENT), applicationController.getApplicationStats);

router
  .route('/')
  .get(authorize(ROLES.STUDENT), validate({ query: applicationListQuery }), applicationController.listApplications)
  .post(authorize(ROLES.STUDENT), validate({ body: createApplicationSchema }), applicationController.createApplication);

router.get('/:id', validate({ params: applicationIdParam }), applicationController.getApplication);

router.patch(
  '/:id/status',
  validate({ params: applicationIdParam, body: transitionSchema }),
  applicationController.transitionApplication
);

router.post(
  '/:id/notes',
  validate({ params: applicationIdParam, body: noteSchema }),
  applicationController.addApplicationNote
);

export default router;
