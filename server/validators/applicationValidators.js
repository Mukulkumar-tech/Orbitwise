import { z } from 'zod';
import { APPLICATION_STATUS_VALUES, INTAKE_SEASONS } from '../constants/index.js';

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

export const applicationIdParam = z.object({ id: objectId });

export const createApplicationSchema = z.object({
  /**
   * Only meaningful for a counsellor acting on a student's behalf.
   *
   * Ignored outright when a student is the caller — the controller uses their
   * own id regardless, so passing someone else's here achieves nothing.
   */
  studentId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid student identifier')
    .optional(),
  courseSlug: z
    .string()
    .trim()
    .min(1, 'Choose a course')
    .max(160)
    .regex(/^[a-z0-9-]+$/, 'Invalid course identifier'),
  intake: z
    .object({
      season: z.enum(INTAKE_SEASONS).optional().or(z.literal('')),
      // Bounded rather than open: a typo of 20255 should fail loudly here, not
      // become a deadline the student plans around.
      year: z.coerce.number().int().min(2024).max(2035).optional().nullable(),
    })
    .optional()
    .default({}),
  matchScore: z.coerce.number().min(0).max(100).optional().nullable(),
});

export const transitionSchema = z.object({
  status: z.enum(APPLICATION_STATUS_VALUES),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});

export const noteSchema = z.object({
  body: z.string().trim().min(1, 'Write something first').max(2000),
  isPrivate: z.coerce.boolean().optional().default(false),
});

export const applicationListQuery = z.object({
  status: z.enum(APPLICATION_STATUS_VALUES).optional(),
});
