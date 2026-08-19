import { Router } from 'express';

import * as catalogueController from '../controllers/catalogueController.js';
import validate from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import { recommendationQuery, slugParam } from '../validators/catalogueValidators.js';

const router = Router();

// optionalAuth, not protect: the catalogue is public, and a signed-in student gets
// the same payload with their OrbitMatch score attached. A bad token here makes the
// request anonymous rather than rejected.
router.get('/', optionalAuth, validate({ query: recommendationQuery }), catalogueController.listCourses);
router.get('/:slug', optionalAuth, validate({ params: slugParam }), catalogueController.getCourse);

export default router;
