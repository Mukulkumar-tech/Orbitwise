import { Router } from 'express';
import { z } from 'zod';

import adminService from '../services/adminService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, paginated } from '../utils/apiResponse.js';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../constants/index.js';

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

/**
 * Admin portal.
 *
 * One `authorize(ADMIN)` at the router level rather than per route: an admin-only
 * endpoint that forgets its guard is the kind of mistake that does not announce
 * itself, and a router-wide gate cannot be forgotten on the next route added.
 */
export const adminRoutes = Router();
adminRoutes.use(protect, authorize(ROLES.ADMIN));

/* ─── Analytics ─────────────────────────────────────────────────────────── */

adminRoutes.get(
  '/stats/overview',
  asyncHandler(async (_req, res) => ok(res, await adminService.overview()))
);

adminRoutes.get(
  '/stats/charts',
  validate({ query: z.object({ months: z.coerce.number().int().min(3).max(24).optional() }) }),
  asyncHandler(async (req, res) => ok(res, await adminService.charts(req.query)))
);

/* ─── Students ──────────────────────────────────────────────────────────── */

/**
 * Shared by the table and the CSV export, so the export can never diverge from
 * the view it claims to mirror.
 */
const studentQuery = z.object({
  search: z.string().trim().max(120).optional(),
  // Tri-state: absent means "everyone", not "unassigned".
  assigned: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  counsellorId: objectId.optional(),
  sort: z.enum(['createdAt', '-createdAt', 'name', '-name', 'lastLogin', '-lastLogin']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

adminRoutes.get(
  '/students',
  validate({ query: studentQuery }),
  asyncHandler(async (req, res) => {
    const { items, total, page, limit } = await adminService.students(req.query);
    return paginated(res, items, { page, limit, total });
  })
);

// Declared before `/students/:id/...` so "export" is never read as an id. The
// regex on objectId would reject it anyway, but with a 400 rather than a file.
adminRoutes.get(
  '/students/export.csv',
  validate({ query: studentQuery.omit({ page: true, limit: true }) }),
  asyncHandler(async (req, res) => {
    const csv = await adminService.studentsCsv(req.query);
    const stamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="orbitwise-students-${stamp}.csv"`);
    return res.status(200).send(csv);
  })
);

adminRoutes.patch(
  '/students/:id/counsellor',
  validate({
    params: z.object({ id: objectId }),
    // Explicit null unassigns. An absent key would be ambiguous with "no change".
    body: z.object({ counsellorUserId: objectId.nullable() }),
  }),
  asyncHandler(async (req, res) =>
    ok(res, await adminService.assignCounsellor(req.params.id, req.body.counsellorUserId))
  )
);

adminRoutes.patch(
  '/students/:id/active',
  validate({ params: z.object({ id: objectId }), body: z.object({ isActive: z.boolean() }) }),
  asyncHandler(async (req, res) => ok(res, await adminService.setStudentActive(req.params.id, req.body.isActive)))
);

/* ─── Counsellors and enquiries ─────────────────────────────────────────── */

adminRoutes.get(
  '/counsellors',
  asyncHandler(async (_req, res) => ok(res, await adminService.counsellors()))
);

adminRoutes.get(
  '/enquiries',
  validate({
    query: z.object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
  }),
  asyncHandler(async (req, res) => {
    const { items, total, page, limit } = await adminService.enquiries(req.query);
    return paginated(res, items, { page, limit, total });
  })
);

export default adminRoutes;
