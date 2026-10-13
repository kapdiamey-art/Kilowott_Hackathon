import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { ActivityEvent } from '../models/ActivityEvent';
import { env } from '../config/env';
import { authLimiter } from '../middleware/rateLimiter';
import { authMiddleware, type AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

const COOKIE_NAME = 'ps_token';
const cookieOpts = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  path: '/',
};

function signToken(userId: string, email: string, role: string) {
  return jwt.sign(
    { sub: userId, email, role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] },
  );
}

// ── Register ─────────────────────────────────────────────────────────────────
const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const data = RegisterSchema.parse(req.body);

  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new AppError(409, 'An account with this email already exists.', 'EMAIL_TAKEN');
  }

  const user = await User.create({
    name: data.name,
    email: data.email,
    passwordHash: data.password, // hashed by pre-save hook
    role: 'editor', // Public registration always gets editor — never admin
    isActive: true,
  });

  await ActivityEvent.create({
    action: 'auth.register',
    entityType: 'user',
    entityId: user._id,
    actor: data.email,
    description: `New account registered: ${data.name}`,
  });

  const token = signToken(String(user._id), user.email, user.role);
  res.cookie(COOKIE_NAME, token, cookieOpts);

  res.status(201).json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// ── Login ─────────────────────────────────────────────────────────────────────
const LoginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const data = LoginSchema.parse(req.body);

  const user = await User.findOne({ email: data.email });

  // Always run comparePassword to prevent timing attacks
  const valid = user ? await user.comparePassword(data.password) : false;

  if (!user || !valid) {
    throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  }

  if (!user.isActive) {
    throw new AppError(403, 'Your account has been deactivated. Contact an administrator.', 'INACTIVE_ACCOUNT');
  }

  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  await ActivityEvent.create({
    action: 'auth.login',
    entityType: 'user',
    entityId: user._id,
    actor: user.email,
    description: `User ${user.name} logged in`,
  });

  const token = signToken(String(user._id), user.email, user.role);
  res.cookie(COOKIE_NAME, token, cookieOpts);

  res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', (req: AuthRequest, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Logged out' });
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.userId).select('-passwordHash').lean();
  if (!user) throw new AppError(404, 'User not found');
  res.json({ user });
});

export default router;
