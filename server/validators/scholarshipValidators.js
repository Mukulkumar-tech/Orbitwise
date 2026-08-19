import { z } from 'zod';
import { DEGREE_LEVELS, STUDY_FIELDS } from '../constants/index.js';

export const scholarshipQuery = z.object({
  countryCode: z.string().trim().length(2).toUpperCase().optional(),
  degreeLevel: z.enum(DEGREE_LEVELS).optional(),
  field: z.enum(STUDY_FIELDS).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
});

export const scholarshipSlugParam = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(180)
    .regex(/^[a-z0-9-]+$/, 'Invalid scholarship identifier'),
});

/** Every line item is optional — the calculator prefills from a course, then the
 *  student overrides whichever numbers they know better. */
const money = z.coerce.number().min(0).max(100_000_000).optional().default(0);

export const costCalculatorSchema = z.object({
  costs: z
    .object({
      tuition: money,
      accommodation: money,
      food: money,
      transport: money,
      insurance: money,
      flights: money,
      other: money,
      visa: money,
      setup: money,
    })
    .default({}),
  durationMonths: z.coerce.number().int().min(1).max(96).default(12),
  annualBudgetInr: z.coerce.number().min(0).max(100_000_000).optional().nullable(),
  /** Either a slug to look up, or an inline award shape for what-if modelling. */
  scholarshipSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  scholarship: z
    .object({
      type: z.enum(['percentage', 'fixed', 'full']),
      percentOfTuition: z.coerce.number().min(0).max(100).optional().default(0),
      amountInr: z.coerce.number().min(0).optional().default(0),
      recurrence: z.enum(['per_year', 'one_time']).optional().default('per_year'),
    })
    .optional()
    .nullable(),
});

/** Prefill the calculator from a real course rather than a blank form. */
export const costPrefillQuery = z.object({
  courseSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});
