import { z } from 'zod';
import { EDUCATION_LEVEL_VALUES } from '../constants/index.js';

export const slugParam = z.object({
  slug: z
    .string()
    .trim()
    .min(1, 'Missing identifier')
    .max(140)
    .regex(/^[a-z0-9-]+$/, 'Invalid identifier'),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  educationLevel: z.enum(EDUCATION_LEVEL_VALUES).optional().or(z.literal('')),
  interestedCountries: z.array(z.string().trim().length(2).toUpperCase()).max(8).optional().default([]),
  message: z.string().trim().min(10, 'Tell us a little more — at least 10 characters').max(2000),
});

export const testimonialQuery = z.object({
  countryCode: z.string().trim().length(2).toUpperCase().optional(),
});
