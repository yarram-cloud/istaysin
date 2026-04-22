// iStays API Server — Entry Point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { setupRLSPolicies } from './modules/tenants/schema-manager';

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
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api/v1', apiLimiter);

// Make io accessible in routes
app.set('io', io);

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'istays-api' });
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

// Prevent uncaught errors from crashing the server
process.on('uncaughtException', (err) => {
  console.error('🚨 [UNCAUGHT EXCEPTION]', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('🚨 [UNHANDLED REJECTION]', reason);
});

export { app, io };
 
