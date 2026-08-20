import { Router } from 'express';
import { z } from 'zod';

import counsellorService from '../services/counsellorService.js';
import appointmentService from '../services/appointmentService.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import validate from '../middleware/validate.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES, APPOINTMENT_TYPES, APPOINTMENT_STATUS, STUDY_FIELDS } from '../constants/index.js';

const objectId = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');
const actor = (req) => ({ userId: req.user._id, role: req.user.role, name: req.user.name });

/* ─── Counsellor portal ─────────────────────────────────────────────────── */

export const counsellorRoutes = Router();
counsellorRoutes.use(protect, authorize(ROLES.COUNSELLOR));

counsellorRoutes.get(
  '/me/dashboard',
  asyncHandler(async (req, res) => ok(res, await counsellorService.dashboard(req.user._id)))
);

counsellorRoutes.get(
  '/me/students',
  asyncHandler(async (req, res) => ok(res, await counsellorService.students(req.user._id)))
);

// No :studentId anywhere else in the portal. The service refuses any id that is
// not on this counsellor's caseload, so the URL grants nothing by itself.
counsellorRoutes.get(
  '/me/students/:studentId',
  validate({ params: z.object({ studentId: objectId }) }),
  asyncHandler(async (req, res) => ok(res, await counsellorService.student(req.user._id, req.params.studentId)))
);

counsellorRoutes.get(
  '/me/review-queue',
  asyncHandler(async (req, res) => ok(res, await counsellorService.reviewQueue(req.user._id)))
);

counsellorRoutes.patch(
  '/me/profile',
  validate({
    body: z.object({
      title: z.string().trim().max(80).optional(),
      bio: z.string().trim().max(600).optional(),
      experienceYears: z.coerce.number().int().min(0).max(60).optional(),
      countries: z.array(z.string().trim().length(2).toUpperCase()).max(20).optional(),
      fields: z.array(z.enum(STUDY_FIELDS)).max(12).optional(),
      languages: z.array(z.string().trim().max(30)).max(10).optional(),
      slotMinutes: z.coerce.number().int().min(15).max(120).optional(),
      isAcceptingStudents: z.coerce.boolean().optional(),
      availability: z
        .array(
          z.object({
            dayOfWeek: z.coerce.number().int().min(0).max(6),
            startMinute: z.coerce.number().int().min(0).max(1439),
            endMinute: z.coerce.number().int().min(1).max(1440),
          })
          // Rejected here rather than stored: a window that ends before it starts
          // generates no slots, so it would look like availability was ignored.
          .refine((w) => w.endMinute > w.startMinute, { message: 'End must be after start' })
        )
        .max(21)
        .optional(),
    }),
  }),
  asyncHandler(async (req, res) => ok(res, await counsellorService.updateProfile(req.user._id, req.body)))
);

/* ─── Appointments — both roles ─────────────────────────────────────────── */

export const appointmentRoutes = Router();

// Public-ish: a student choosing a counsellor needs the list before booking.
appointmentRoutes.get(
  '/counsellors',
  protect,
  asyncHandler(async (_req, res) => ok(res, await appointmentService.listCounsellors()))
);

appointmentRoutes.get(
  '/availability/:counsellorUserId',
  protect,
  validate({
    params: z.object({ counsellorUserId: objectId }),
    query: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD') }),
  }),
  asyncHandler(async (req, res) =>
    ok(res, await appointmentService.availableSlots(req.params.counsellorUserId, req.query.date))
  )
);

appointmentRoutes.get(
  '/',
  protect,
  validate({ query: z.object({ upcoming: z.coerce.boolean().optional() }) }),
  asyncHandler(async (req, res) => ok(res, await appointmentService.listFor(actor(req), req.query)))
);

appointmentRoutes.post(
  '/',
  protect,
  authorize(ROLES.STUDENT),
  validate({
    body: z.object({
      counsellorUserId: objectId,
      type: z.enum(APPOINTMENT_TYPES),
      startsAt: z.string().min(1),
      mode: z.enum(['video', 'phone', 'in_person']).optional(),
      agenda: z.string().trim().max(500).optional(),
    }),
  }),
  asyncHandler(async (req, res) =>
    created(res, await appointmentService.book({ studentId: req.user._id, ...req.body }))
  )
);

appointmentRoutes.patch(
  '/:id/status',
  protect,
  validate({
    params: z.object({ id: objectId }),
    body: z.object({
      status: z.enum(APPOINTMENT_STATUS),
      reason: z.string().trim().max(300).optional(),
      outcome: z.string().trim().max(1000).optional(),
    }),
  }),
  asyncHandler(async (req, res) => ok(res, await appointmentService.setStatus(req.params.id, req.body, actor(req))))
);

appointmentRoutes.patch(
  '/:id/reschedule',
  protect,
  validate({ params: z.object({ id: objectId }), body: z.object({ startsAt: z.string().min(1) }) }),
  asyncHandler(async (req, res) => ok(res, await appointmentService.reschedule(req.params.id, req.body, actor(req))))
);
