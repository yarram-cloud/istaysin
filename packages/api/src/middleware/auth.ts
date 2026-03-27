import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../config/jwt';

export interface AuthPayload {
  userId: string;
  email: string;
  tenantId?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      userId?: string;
    }
  }
}

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token and attaches user info to req.user
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    req.userId = payload.userId;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: 'Session expired, please log in again' });
    return;
  }
}

/**
 * Optional authentication — sets req.user if token present, continues regardless
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = getJwtSecret();
      req.user = jwt.verify(token, secret) as AuthPayload;
      req.userId = req.user.userId;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }

  next();
}
