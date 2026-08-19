import { Router } from 'express';

import * as studentController from '../controllers/studentController.js';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';
import { updateProfileSchema, courseIdParam } from '../validators/profileValidators.js';
import { recommendationQuery } from '../validators/catalogueValidators.js';

const router = Router();

/**
 * The student portal.
 *
 * `protect` then `authorize(STUDENT)` applies to the whole router rather than to
 * each route: a new endpoint added below is authenticated by default, which is the
 * only safe direction for that mistake to fall.
 *
 * Every path says `me`. There is no student-id parameter to tamper with.
 */
router.use(protect, authorize(ROLES.STUDENT));

router.get('/me/dashboard', studentController.getDashboard);

router.get('/me/profile', studentController.getProfile);
router.patch('/me/profile', validate({ body: updateProfileSchema }), studentController.updateProfile);

router.get(
  '/me/recommendations',
  validate({ query: recommendationQuery }),
  studentController.getRecommendations
);

router.get('/me/shortlist', studentController.getShortlist);
router.post('/me/shortlist/:courseId', validate({ params: courseIdParam }), studentController.addToShortlist);
router.delete('/me/shortlist/:courseId', validate({ params: courseIdParam }), studentController.removeFromShortlist);

export default router;
