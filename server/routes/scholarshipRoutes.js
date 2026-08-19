import { Router } from 'express';

import * as scholarshipController from '../controllers/scholarshipController.js';
import * as toolsController from '../controllers/toolsController.js';
import validate from '../middleware/validate.js';
import { optionalAuth, protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';
import { scholarshipQuery, scholarshipSlugParam, costCalculatorSchema, costPrefillQuery } from '../validators/scholarshipValidators.js';

export const scholarshipRoutes = Router();

// optionalAuth: public catalogue for visitors, scored and ranked for a student.
scholarshipRoutes.get('/', optionalAuth, validate({ query: scholarshipQuery }), scholarshipController.listScholarships);

// Before '/:slug', or "deadlines" is looked up as a scholarship slug.
scholarshipRoutes.get(
  '/deadlines',
  protect,
  authorize(ROLES.STUDENT),
  scholarshipController.getScholarshipDeadlines
);

scholarshipRoutes.get('/:slug', validate({ params: scholarshipSlugParam }), scholarshipController.getScholarship);

export const toolRoutes = Router();

toolRoutes.get(
  '/cost-calculator/prefill',
  optionalAuth,
  validate({ query: costPrefillQuery }),
  toolsController.getCostPrefill
);

toolRoutes.post(
  '/cost-calculator',
  optionalAuth,
  validate({ body: costCalculatorSchema }),
  toolsController.calculate
);
