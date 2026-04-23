import { validateRequest } from '../../middleware/validate';
import { Router, Request, Response } from 'express';
import { randomInt } from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database';
import { getJwtSecret, getJwtRefreshSecret, JWT_ACCESS_EXPIRY, JWT_REFRESH_EXPIRY } from '../../config/jwt';
import { authenticate } from '../../middleware/auth';
import { authLimiter } from '../../middleware/rate-limit';
import { registerSchema, loginSchema, whatsappOtpSchema, verifyOtpSchema, refreshTokenSchema, updateLanguageSchema } from '@istays/shared';
import { sendWelcomeEmail } from '../../services/email';
import { dispatchOtpMessage } from '../../services/whatsapp';

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
    const otpCode = req.body.otpCode;
    const email = parsed.data.email ? parsed.data.email.toLowerCase().trim() : `${phone}@istays.local`;

    if (!otpCode || !phone) {
      res.status(400).json({ success: false, error: 'Phone number and OTP code are required for registration.' });
      return;
    }

    // Verify OTP explicitly before allowing global user creation
    const otpRecord = await prisma.otpVerification.findUnique({ where: { phone } });
    if (!otpRecord) {
      res.status(400).json({ success: false, error: 'No OTP requested for this phone number.' });
      return;
    }
    if (otpRecord.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: 'OTP has expired. Please request a new one.' });
      return;
    }
    const codeMatches = await bcrypt.compare(otpCode, otpRecord.code);
    if (!codeMatches) {
      await prisma.otpVerification.update({ where: { phone }, data: { attempts: { increment: 1 } } });
      res.status(400).json({ success: false, error: 'Invalid OTP code.' });
      return;
    }

    // OTP matched! Destroy it to prevent replay
    await prisma.otpVerification.delete({ where: { phone } });

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

    // CRM Identity Merge - Link or create GuestProfile
    let guestProfile = await prisma.guestProfile.findFirst({
      where: { email: email }
    });
    
    if (guestProfile) {
      await prisma.guestProfile.update({
        where: { id: guestProfile.id },
        data: { globalUserId: user.id }
      });
    } else {
      await prisma.guestProfile.create({
        data: {
          globalUserId: user.id,
          email: email,
          fullName: fullName,
          phone: phone,
        }
      });
    }

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

    const identifier = parsed.data.identifier.trim();
    const { password } = parsed.data;

    const user = await prisma.globalUser.findFirst({
      where: { 
        OR: [
          { phone: { equals: identifier } },
          { email: { equals: identifier.toLowerCase() } }
        ]
      },
      include: {
        memberships: {
          where: { isActive: true },
          include: { tenant: { select: { id: true, name: true, slug: true, status: true, plan: true, propertyType: true } } },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(403).json({ success: false, error: 'Account is locked. Please try again later.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      if (newAttempts >= 5) {
        await prisma.globalUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: newAttempts, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
        });
        res.status(403).json({ success: false, error: 'Account locked due to too many failed attempts' });
        return;
      } else {
        await prisma.globalUser.update({
          where: { id: user.id },
          data: { failedLoginAttempts: newAttempts }
        });
        res.status(401).json({ success: false, error: 'Invalid credentials' });
        return;
      }
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.globalUser.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null }
      });
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
          preferredLanguage: user.preferredLanguage,
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

// POST /auth/send-whatsapp-otp
authRouter.post('/send-whatsapp-otp', validateRequest(whatsappOtpSchema), authLimiter, async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, error: 'Phone number required' });
      return;
    }

    // Generate cryptographically secure 6 digit OTP
    const code = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Hash OTP before storing — never store plaintext codes
    const hashedCode = await bcrypt.hash(code, 10);

    await prisma.otpVerification.upsert({
      where: { phone },
      update: { code: hashedCode, expiresAt, attempts: 0 },
      create: { phone, code: hashedCode, expiresAt }
    });

    // Fire off WhatsApp Meta API wrapper (abstracted internally)
    await dispatchOtpMessage(phone, code);

    res.json({ success: true, message: 'OTP sent successfully!' });
  } catch (err: any) {
    console.error('[SEND OTP ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to send WhatsApp OTP' });
  }
});

// POST /auth/verify-whatsapp-otp
authRouter.post('/verify-whatsapp-otp', validateRequest(verifyOtpSchema), authLimiter, async (req: Request, res: Response) => {
  try {
    const { phone, code, targetRole = 'guest' } = req.body;
    if (!phone || !code) {
      res.status(400).json({ success: false, error: 'Phone and code required' });
      return;
    }

    const record = await prisma.otpVerification.findUnique({ where: { phone } });
    if (!record) {
      res.status(400).json({ success: false, error: 'No OTP requested for this phone' });
      return;
    }

    if (record.expiresAt < new Date()) {
      res.status(400).json({ success: false, error: 'OTP has expired' });
      return;
    }

    if (record.attempts >= 5) {
      res.status(403).json({ success: false, error: 'Too many failed attempts. Request a new code.' });
      return;
    }

    const codeMatches = await bcrypt.compare(code, record.code);
    if (!codeMatches) {
      await prisma.otpVerification.update({
        where: { phone },
        data: { attempts: { increment: 1 } }
      });
      res.status(400).json({ success: false, error: 'Invalid OTP code' });
      return;
    }

    // Destroy OTP on success
    await prisma.otpVerification.delete({ where: { phone } });

    // Login routing
    let userId = null;
    let finalRole = 'guest';
    let email = phone + '@verified.local';
    let tenantId = null;

    if (targetRole === 'staff') {
      const staffUser = await prisma.globalUser.findFirst({
        where: { phone },
        include: { memberships: { where: { isActive: true }, take: 1 } }
      });
      if (!staffUser) {
        res.status(404).json({ success: false, error: 'No staff account matched this phone number' });
        return;
      }
      userId = staffUser.id;
      email = staffUser.email || '';
      if (staffUser.memberships.length > 0) {
        tenantId = staffUser.memberships[0].tenantId;
        finalRole = staffUser.memberships[0].role;
      } else if (staffUser.isGlobalAdmin) {
        finalRole = 'global_admin';
      } else {
        res.status(403).json({ success: false, error: 'Staff user has no active tenant assignment' });
        return;
      }
    } else {
      const guestProfile = await prisma.guestProfile.findFirst({ where: { phone } });
      if (!guestProfile) {
        // Generate unguessable hash so email/password login is impossible for OTP-only accounts
        const randomHash = await bcrypt.hash(randomInt(0, 2147483647).toString() + Date.now(), 12);
        const newAuthUser = await prisma.globalUser.create({
          data: { email, passwordHash: randomHash, fullName: 'Verified Guest', phone }
        });
        await prisma.guestProfile.create({
          data: { phone, email, fullName: 'Verified Guest', globalUserId: newAuthUser.id }
        });
        userId = newAuthUser.id;
      } else if (guestProfile.globalUserId) {
        // Guest profile exists AND is linked to a GlobalUser — use that userId
        userId = guestProfile.globalUserId;
        email = guestProfile.email || email;
      } else {
        // Orphaned guest profile (no linked GlobalUser) — create one and link
        const randomHash = await bcrypt.hash(randomInt(0, 2147483647).toString() + Date.now(), 12);
        const newAuthUser = await prisma.globalUser.create({
          data: { email, passwordHash: randomHash, fullName: guestProfile.fullName || 'Verified Guest', phone }
        });
        await prisma.guestProfile.update({
          where: { id: guestProfile.id },
          data: { globalUserId: newAuthUser.id }
        });
        userId = newAuthUser.id;
        email = guestProfile.email || email;
      }
    }

    const tokenPayload: any = { userId, email, role: finalRole, phone };
    if (tenantId) tokenPayload.tenantId = tenantId;

    const accessToken = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_ACCESS_EXPIRY });
    const refreshToken = jwt.sign(tokenPayload, getJwtRefreshSecret(), { expiresIn: JWT_REFRESH_EXPIRY });

    res.json({
      success: true,
      data: {
        user: { id: userId, phone, role: finalRole },
        accessToken,
        refreshToken
      }
    });

  } catch (err: any) {
    console.error('[VERIFY OTP ERROR]', err);
    res.status(500).json({ success: false, error: 'Internal server error during verification' });
  }
});

// POST /auth/refresh-token
authRouter.post('/refresh-token', validateRequest(refreshTokenSchema), async (req: Request, res: Response) => {
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

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      res.status(403).json({ success: false, error: 'Account is locked. Please try again later.' });
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
        preferredLanguage: true,
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

// PUT /auth/me/language — update user preferred language
authRouter.put('/me/language', validateRequest(updateLanguageSchema), authenticate, async (req: Request, res: Response) => {
  try {
    const { language } = req.body;
    if (!language) {
      res.status(400).json({ success: false, error: 'Language is required' });
      return;
    }

    await prisma.globalUser.update({
      where: { id: req.userId },
      data: { preferredLanguage: language },
    });

    res.json({ success: true, message: 'Language preference updated' });
  } catch (err) {
    console.error('[AUTH UPDATE LANGUAGE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to update string language preference' });
  }
});

