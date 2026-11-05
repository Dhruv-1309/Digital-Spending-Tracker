import { Router } from 'express';
import { signupRateLimiter } from '../middleware/rateLimiter.js';
import { AppError } from '../middleware/errorHandler.js';

export const authRouter = Router();

/**
 * POST /auth/register
 *
 * Rate-limited signup endpoint scoped strictly by client IP.
 * Protects open registration from bot spam and automated brute force.
 *
 * Optional Turnstile verification:
 * If TURNSTILE_SECRET_KEY is configured in the environment, verifies the submitted
 * turnstileToken with Cloudflare before permitting account creation.
 */
authRouter.post('/register', signupRateLimiter, async (req, res, next) => {
  try {
    const { email, turnstileToken } = req.body || {};

    // 1. CAPTCHA Verification (Only active if TURNSTILE_SECRET_KEY is supplied in environment)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
      if (!turnstileToken) {
        throw new AppError(
          400,
          'CAPTCHA_REQUIRED',
          'Please complete the security verification to sign up.',
        );
      }

      try {
        const verifyRes = await fetch(
          'https://challenges.cloudflare.com/turnstile/v0/siteverify',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              secret: turnstileSecret,
              response: String(turnstileToken),
              remoteip: req.ip || '',
            }),
          },
        );

        const verifyData = (await verifyRes.json()) as { success: boolean };
        if (!verifyData.success) {
          throw new AppError(
            400,
            'CAPTCHA_FAILED',
            'Security verification failed. Please try again.',
          );
        }
      } catch (err: unknown) {
        if (err instanceof AppError) throw err;
        throw new AppError(
          500,
          'CAPTCHA_ERROR',
          'Unable to verify security challenge at this time. Please try again.',
        );
      }
    }

    // 2. Validate email syntax if provided in payload
    if (email && typeof email === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Please enter a valid email address.');
      }
    }

    res.status(200).json({
      success: true,
      message: 'Signup checks passed successfully.',
    });
  } catch (err) {
    next(err);
  }
});
