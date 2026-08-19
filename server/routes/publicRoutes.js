import { Router } from 'express';

import * as publicController from '../controllers/publicController.js';
import validate from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { enquirySchema, slugParam, testimonialQuery } from '../validators/publicValidators.js';

/**
 * The public marketing site's own endpoints.
 *
 * Detail routes for a destination and an institution live here rather than under
 * /countries and /universities because they compose a whole page — the country
 * plus its institutions plus its programme-level breakdown — instead of returning
 * one collection.
 */
const router = Router();

router.get('/home', publicController.getHome);
router.get('/testimonials', validate({ query: testimonialQuery }), publicController.listTestimonials);
router.get('/countries/:slug', validate({ params: slugParam }), publicController.getCountry);
router.get('/universities/:slug', validate({ params: slugParam }), publicController.getUniversity);

// A public write endpoint is the most-abused surface on any site, so it carries
// the strict credential limiter rather than the generous global one.
router.post('/enquiries', authLimiter, validate({ body: enquirySchema }), publicController.submitEnquiry);

export default router;
