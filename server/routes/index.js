import { Router } from 'express';

import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import courseRoutes from './courseRoutes.js';
import { countryRoutes, universityRoutes, optionRoutes } from './catalogueRoutes.js';
import publicRoutes from './publicRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import { scholarshipRoutes, toolRoutes } from './scholarshipRoutes.js';

const router = Router();

router.use('/auth', authRoutes);

// ─── Public marketing site ──────────────────────────────────────────────────
router.use('/public', publicRoutes);

// ─── Catalogue (public, personalized when a student is signed in) ───────────
router.use('/courses', courseRoutes);
router.use('/universities', universityRoutes);
router.use('/countries', countryRoutes);
router.use('/scholarships', scholarshipRoutes);
router.use('/options', optionRoutes);

// ─── Planning tools ─────────────────────────────────────────────────────────
router.use('/tools', toolRoutes);

// ─── Student portal (authenticated, self-scoped) ────────────────────────────
router.use('/students', studentRoutes);
router.use('/applications', applicationRoutes);

// Remaining feature routers mount here as each phase lands:
//   /scholarships  /applications  /documents  /counsellors  /appointments
//   /messages  /notifications  /tools  /ai  /admin  /public
//
// /health is mounted separately in app.js, ahead of the rate limiter.

export default router;
