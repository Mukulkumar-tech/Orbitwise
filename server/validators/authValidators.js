import { z } from 'zod';

export const emailSchema = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Enter a valid email address');

/**
 * Password policy: length over character-class gymnastics.
 *
 * A 10-character passphrase resists guessing better than "P@ss1!" and is far
 * likelier to be remembered than written on a sticky note. One letter and one
 * number is enough structure to block "aaaaaaaaaa".
 */
export const passwordSchema = z
  .string({ required_error: 'Password is required' })
  .min(10, 'Use at least 10 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[a-zA-Z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

const nameSchema = z
  .string({ required_error: 'Name is required' })
  .trim()
  .min(2, 'Enter your full name')
  .max(80, 'Name cannot exceed 80 characters');

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{6,19}$/, 'Enter a valid phone number')
  .optional()
  .or(z.literal(''));

const tokenParam = z.object({
  token: z.string().min(20, 'Invalid link').max(200),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  // `role` is intentionally absent. Zod strips unknown keys, so a client that
  // posts `role: "admin"` has it discarded before the service ever sees it.
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resendVerificationSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Invalid reset link'),
  password: passwordSchema,
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Choose a password different from your current one',
    path: ['newPassword'],
  });

export const verifyEmailParams = tokenParam;
