import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  actor?: string;   // email or username
  userId?: string;  // MongoDB user id
  userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Support both cookie (preferred) and Authorization: Bearer header (for API tools)
  const token =
    req.cookies?.ps_token ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (!token) {
    res.status(401).json({ error: 'Authentication required', code: 'NO_TOKEN' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role: string;
    };
    req.userId = payload.sub;
    req.actor = payload.email;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session', code: 'INVALID_TOKEN' });
  }
}

export function requireRole(role: 'admin' | 'editor') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const hierarchy = { admin: 2, editor: 1, viewer: 0 };
    const userLevel = hierarchy[req.userRole as keyof typeof hierarchy] ?? 0;
    const requiredLevel = hierarchy[role];
    if (userLevel < requiredLevel) {
      res.status(403).json({ error: 'Insufficient permissions', code: 'FORBIDDEN' });
      return;
    }
    next();
  };
}
