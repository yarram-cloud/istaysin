import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { getJwtSecret, getJwtRefreshSecret, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../../config/jwt';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rate-limit';
import { registerSchema, loginSchema } from '@istays/shared';
import { sendWelcomeEmail } from '../../services/email';

export const authRouter = Router();

// POST /auth/register
authRouter.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const { password, fullName, phone } = parsed.data;
    const email = parsed.data.email.toLowerCase().trim();

    // Check if user exists (case-insensitive)
    const existing = await prisma.globalUser.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing) {
      res.status(409).json({ success: false, error: 'An account with this email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.globalUser.create({
      data: { email, passwordHash, fullName, phone },
      select: { id: true, email: true, fullName: true, phone: true, createdAt: true },
    });

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtSecret(),
      { expiresIn: JWT_ACCESS_EXPIRY },
    );
    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      getJwtRefreshSecret(),
      { expiresIn: JWT_REFRESH_EXPIRY },
    );

    // Send welcome email (async, don't block response)
    sendWelcomeEmail(email, fullName).catch(console.error);

    res.status(201).json({
      success: true,
      data: { user, accessToken, refreshToken },
      message: 'Account created successfully',
    });
  } catch (err) {
    console.error('[AUTH REGISTER ERROR]', err);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /auth/login
authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    const email = parsed.data.email.toLowerCase().trim();
    const { password } = parsed.data;

    const user = await prisma.globalUser.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        memberships: {
          where: { isActive: true },
          include: { tenant: { select: { id: true, name: true, slug: true, status: true, plan: true, propertyType: true } } },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Find first active tenant membership for JWT
    const firstMembership = user.memberships[0];

    const tokenPayload: Record<string, any> = {
      userId: user.id,
      email: user.email,
    };
    if (firstMembership) {
      tokenPayload.tenantId = firstMembership.tenantId;
      tokenPayload.role = firstMembership.role;
    }
    if (user.isGlobalAdmin) {
      tokenPayload.role = 'global_admin';
      tokenPayload.isGlobalAdmin = true;
    }

    const accessToken = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_ACCESS_EXPIRY });
    const refreshToken = jwt.sign({ userId: user.id, email: user.email }, getJwtRefreshSecret(), { expiresIn: JWT_REFRESH_EXPIRY });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          isGlobalAdmin: user.isGlobalAdmin,
          emailVerified: user.emailVerified,
        },
        memberships: user.memberships.map((m) => ({
          tenantId: m.tenantId,
          role: m.role,
          tenant: m.tenant,
        })),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('[AUTH LOGIN ERROR]', err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// POST /auth/refresh-token
authRouter.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ success: false, error: 'Refresh token required' });
      return;
    }

    const payload = jwt.verify(refreshToken, getJwtRefreshSecret()) as { userId: string; email: string };

    const user = await prisma.globalUser.findUnique({
      where: { id: payload.userId },
      include: { memberships: { where: { isActive: true }, take: 1 } },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid refresh token' });
      return;
    }

    const tokenPayload: Record<string, any> = { userId: user.id, email: user.email };
    if (user.memberships[0]) {
      tokenPayload.tenantId = user.memberships[0].tenantId;
      tokenPayload.role = user.memberships[0].role;
    }
    if (user.isGlobalAdmin) {
      tokenPayload.role = 'global_admin';
      tokenPayload.isGlobalAdmin = true;
    }

    const newAccessToken = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_ACCESS_EXPIRY });

    res.json({ success: true, data: { accessToken: newAccessToken } });
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired refresh token' });
  }
});

// GET /auth/me — get current user info
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.globalUser.findUnique({
      where: { id: req.userId },
      select: {
        id: true, email: true, fullName: true, phone: true, isGlobalAdmin: true,
        emailVerified: true, twoFactorEnabled: true, avatarUrl: true, createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const memberships = await prisma.tenantMembership.findMany({
      where: { userId: req.userId, isActive: true },
      include: {
        tenant: {
          select: { id: true, name: true, slug: true, status: true, plan: true, propertyType: true, brandLogo: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        user,
        memberships: memberships.map((m) => ({
          tenantId: m.tenantId,
          role: m.role,
          permissions: m.permissions,
          tenant: m.tenant,
        })),
      },
    });
  } catch (err) {
    console.error('[AUTH ME ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch user info' });
  }
});
