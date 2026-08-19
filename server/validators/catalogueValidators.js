import { z } from 'zod';
import { DEGREE_LEVELS, STUDY_FIELDS } from '../constants/index.js';

/**
 * Query validation for catalogue and recommendation endpoints.
 *
 * Query strings are always strings, so everything numeric is coerced here — which
 * is also what keeps `page=1;drop` or `limit[$gt]=0` from reaching a Mongo query:
 * a value that will not coerce is a 400, not a filter.
 */

const page = z.coerce.number().int().min(1).default(1);

/**
 * Booleans need explicit parsing.
 *
 * `z.coerce.boolean()` is a trap for query strings: it applies JavaScript
 * truthiness, so `?allFields=false` arrives as the string "false" and coerces to
 * **true** — the filter would invert itself and nobody would see an error.
 */
const flag = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

const countryCode = z.string().trim().length(2).toUpperCase();

export const recommendationQuery = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(48).default(12),
  countryCode: countryCode.optional(),
  field: z.enum(STUDY_FIELDS).optional(),
  degreeLevel: z.enum(DEGREE_LEVELS).optional(),
  maxTuitionInr: z.coerce.number().min(0).max(50_000_000).optional(),
  q: z.string().trim().min(1).max(80).optional(),
  /** Ignore the profile's subject preferences and search the whole catalogue. */
  allFields: flag,
});

export const universityQuery = z.object({
  page,
  limit: z.coerce.number().int().min(1).max(48).default(12),
  countryCode: countryCode.optional(),
});

export const slugParam = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Invalid course link'),
});
