import { Router } from 'express';

import * as authController from '../controllers/authController.js';
import validate from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendVerificationSchema,
  changePasswordSchema,
  verifyEmailParams,
} from '../validators/authValidators.js';

const router = Router();

// Credential endpoints carry the strict limiter — these are the ones worth
// brute-forcing. /refresh and /logout are excluded: they run on every page load
// and a legitimate session must never be rate-limited out of existence.
router.post('/register', authLimiter, validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
router.post(
  '/resend-verification',
  authLimiter,
  validate({ body: resendVerificationSchema }),
  authController.resendVerification
);

router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/verify-email/:token', validate({ params: verifyEmailParams }), authController.verifyEmail);

router.get('/me', protect, authController.me);
router.post('/change-password', protect, validate({ body: changePasswordSchema }), authController.changePassword);

export default router;
