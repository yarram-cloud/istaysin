// iStays API Server — Entry Point
//
// `./instrument` MUST be the first import. It bootstraps Sentry's auto-
// instrumentation BEFORE any other module loads `http`, `express`, or
// `prisma`. Move it down and you'll silently lose tracing on those modules.
import './instrument';

import express from 'express';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupRLSPolicies } from './modules/tenants/schema-manager';
import { prisma } from './config/database';

import { authRouter } from './modules/auth/router';
import { tenantsRouter } from './modules/tenants/router';
import { roomsRouter } from './modules/rooms/router';
import { bookingsRouter } from './modules/bookings/router';
import { guestsRouter } from './modules/guests/router';
import { checkInOutRouter } from './modules/check-in-out/router';
import { billingRouter } from './modules/billing/router';
import { publicRouter } from './modules/public/router';
import { platformRouter } from './modules/platform/router';
import { notificationsRouter } from './modules/notifications/router';
import { analyticsRouter } from './modules/analytics/router';
import { complianceRouter } from './modules/compliance/router';
import { dashboardRouter } from './modules/dashboard/router';
import { housekeepingRouter } from './modules/housekeeping/router';
import { pricingRouter } from './modules/pricing/router';
import { usersRouter } from './modules/users/router';
import { reviewsRouter } from './modules/reviews/router';
import { shiftsRouter } from './modules/shifts/router';
import { channelsRouter } from './modules/channels/router';
import { loyaltyRouter } from './modules/loyalty/router';
import { groupsRouter } from './modules/groups/router';
import { posRouter } from './modules/pos/router';
import { nightAuditRouter } from './modules/night-audit/router';
import { guestPortalRouter } from './modules/guest-portal/router';
import { paymentsRouter } from './modules/payments/router';
import { couponsRouter } from './modules/coupons/router';
import { errorHandler } from './middleware/error-handler';
import { apiLimiter } from './middleware/rate-limit';

dotenv.config({ path: '../../.env' });

const app = express();
const httpServer = createServer(app);

// Socket.IO setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3100',
    methods: ['GET', 'POST'],
  },
});

// Trust proxy (required behind load balancer for correct IP)
app.set('trust proxy', 1);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3100' }));
// Compress JSON / text responses ≥1KB. Skips already-compressed content
// (images, video) automatically. Saves ~60-80% on bandwidth for the
// roomTypes / bookings / analytics payloads which are JSON-heavy.
app.use(
  compression({
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  }),
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/v1', apiLimiter);

// Make io accessible in routes
app.set('io', io);

// ── Health checks ────────────────────────────────────────────────────────────
// /health is a *liveness* probe — process is up, can serve. Used by orchestrator
// to decide whether to restart. Cheap, no external dependencies.
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'istays-api' });
});

// /health/ready is a *readiness* probe — process can actually serve traffic
// (DB reachable). Used by load balancers to decide which replicas to route to.
// A replica that fails this should be drained, not killed.
app.get('/api/v1/health/ready', async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({ status: 'ready', db: 'reachable', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(503).json({ status: 'not_ready', db: 'unreachable', error: err?.message });
  }
});

// Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/tenants', tenantsRouter);
app.use('/api/v1/rooms', roomsRouter);
app.use('/api/v1/bookings', bookingsRouter);
app.use('/api/v1/guests', guestsRouter);
app.use('/api/v1/check-in-out', checkInOutRouter);
app.use('/api/v1/billing', billingRouter);
app.use('/api/v1/public', publicRouter);
app.use('/api/v1/platform', platformRouter);
app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/housekeeping', housekeepingRouter);
app.use('/api/v1/pricing', pricingRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/shifts', shiftsRouter);
app.use('/api/v1/channels', channelsRouter);
app.use('/api/v1/loyalty', loyaltyRouter);
app.use('/api/v1/compliance', complianceRouter);
app.use('/api/v1/groups', groupsRouter);
app.use('/api/v1/pos', posRouter);
app.use('/api/v1/night-audit', nightAuditRouter);
app.use('/api/v1/guest-portal', guestPortalRouter);
app.use('/api/v1/coupons', couponsRouter);

// Sentry's express error handler must run AFTER all routes but BEFORE our
// custom error handler so it sees + reports unhandled exceptions before they
// are translated into client-facing JSON responses. No-op when SENTRY_DSN is
// unset — Sentry detects the absent client and skips the work.
Sentry.setupExpressErrorHandler(app);

// Error handler
app.use(errorHandler);

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
  if (!token) {
    return next(new Error('Authentication required'));
  }
  try {
    const jwtLib = require('jsonwebtoken');
    const jwtConfig = require('./config/jwt');
    const payload = jwtLib.verify(token, jwtConfig.getJwtSecret());
    (socket as any).user = payload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  const user = (socket as any).user;
  console.log(`[Socket.IO] Client connected: ${socket.id} (user: ${user?.email || 'unknown'})`);

  socket.on('join-property', (propertyId: string) => {
    // Only allow joining if the user's JWT contains this tenantId
    if (user?.tenantId === propertyId || user?.role === 'global_admin') {
      socket.join(`property:${propertyId}`);
      console.log(`[Socket.IO] ${socket.id} joined property:${propertyId}`);
    } else {
      socket.emit('error', { message: 'Not authorized for this property' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.API_PORT || 4100;
httpServer.listen(PORT, () => {
  console.log(`🏨 iStays API server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/v1/health`);

  // Setup RLS policies (safe to run multiple times)
  setupRLSPolicies().catch((err) => {
    console.error('⚠️ RLS setup error:', err.message);
  });
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
//
// Why this matters: when the orchestrator (Render/Fly/k8s) deploys a new
// version, it sends SIGTERM and waits ~30s before SIGKILL. Without a handler:
//   1. New requests keep being accepted into the dying process
//   2. In-flight requests are killed mid-response (truncated payloads, 502s)
//   3. Open Socket.IO connections drop without a "disconnect" event
//   4. Prisma's pg connections close ungracefully, can leak server-side
//
// Sequence: stop new connections → drain in-flight → close Socket.IO →
// disconnect Prisma → exit. Hard timeout at 25s leaves headroom inside the
// 30s SIGKILL grace window.
let isShuttingDown = false;
const SHUTDOWN_DEADLINE_MS = 25_000;
const SHUTDOWN_POLL_MS = 200;

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[shutdown] Received ${signal}, draining…`);

  // Stop accepting new connections (existing ones keep being served)
  httpServer.close((err) => {
    if (err) console.error('[shutdown] httpServer close error:', err);
  });

  // Tell Socket.IO clients to disconnect cleanly
  try {
    await new Promise<void>((resolve) => io.close(() => resolve()));
  } catch (err) {
    console.error('[shutdown] Socket.IO close error:', err);
  }

  // Wait for in-flight HTTP connections to finish
  const deadline = Date.now() + SHUTDOWN_DEADLINE_MS;
  while (Date.now() < deadline) {
    const conns: number = await new Promise((resolve) => {
      httpServer.getConnections((err, count) => resolve(err ? 0 : count));
    });
    if (conns === 0) break;
    await new Promise((r) => setTimeout(r, SHUTDOWN_POLL_MS));
  }

  // Release DB connections
  try {
    await prisma.$disconnect();
  } catch (err) {
    console.error('[shutdown] prisma.$disconnect error:', err);
  }

  console.log('[shutdown] Drained, exiting.');
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// Crash policy: log then trigger graceful shutdown so the orchestrator can
// restart us. Continuing in an undefined state (the previous behavior) is
// worse than a clean restart — corrupted state can persist for hours.
process.on('uncaughtException', (err) => {
  console.error('🚨 [UNCAUGHT EXCEPTION]', err.message, err.stack);
  void shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason) => {
  console.error('🚨 [UNHANDLED REJECTION]', reason);
  void shutdown('unhandledRejection');
});

export { app, io };
