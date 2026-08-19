import { z } from 'zod';
import { DOCUMENT_TYPES, REVIEWABLE_DOCUMENT_STATUSES } from '../constants/index.js';

const objectId = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid identifier');

export const documentIdParam = z.object({ id: objectId });
export const studentIdParam = z.object({ studentId: objectId });

/**
 * Multipart fields arrive as strings, so everything here coerces.
 *
 * `type` is validated against the enum rather than accepted freely: it decides
 * which checklist slot the file fills, and an arbitrary value would create a
 * document the checklist can never show or satisfy.
 */
export const uploadDocumentSchema = z.object({
  type: z.enum(DOCUMENT_TYPES, { errorMap: () => ({ message: 'Choose a valid document type' }) }),
  expiresAt: z.coerce.date().optional().nullable().or(z.literal('')),
});

export const reviewDocumentSchema = z.object({
  status: z.enum(REVIEWABLE_DOCUMENT_STATUSES, {
    errorMap: () => ({ message: 'A review must set under_review, verified or rejected' }),
  }),
  note: z.string().trim().max(500).optional().or(z.literal('')),
});
