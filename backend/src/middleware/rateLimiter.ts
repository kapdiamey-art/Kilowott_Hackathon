import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isDev = env.NODE_ENV !== 'production';

export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: isDev ? 10000 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
  skip: () => isDev, // completely skip in development
});

// Auth limiter — lenient in dev, strict in prod
export const authLimiter = rateLimit({
  windowMs: isDev ? 60 * 1000 : 15 * 60 * 1000,
  max: isDev ? 1000 : 10,
  message: { error: 'Too many login attempts — please try again later.' },
  skip: () => isDev, // completely skip rate limiting in development
});
