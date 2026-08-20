import { Router } from 'express';

import authRoutes from './authRoutes.js';
import studentRoutes from './studentRoutes.js';
import courseRoutes from './courseRoutes.js';
import { countryRoutes, universityRoutes, optionRoutes } from './catalogueRoutes.js';
import publicRoutes from './publicRoutes.js';
import applicationRoutes from './applicationRoutes.js';
import { scholarshipRoutes, toolRoutes } from './scholarshipRoutes.js';
import documentRoutes from './documentRoutes.js';
import { counsellorRoutes, appointmentRoutes } from './counsellorRoutes.js';
import adminRoutes from './adminRoutes.js';

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
router.use('/documents', documentRoutes);
router.use('/appointments', appointmentRoutes);

// ─── Counsellor portal (authenticated, caseload-scoped) ─────────────────────
router.use('/counsellors', counsellorRoutes);

// ─── Admin portal (authenticated, admin-only at the router level) ───────────
router.use('/admin', adminRoutes);

// Remaining feature routers mount here as each phase lands:
//   /messages  /notifications  /ai
//
// /health is mounted separately in app.js, ahead of the rate limiter.

export default router;
