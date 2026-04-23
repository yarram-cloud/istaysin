import { validateRequest } from '../../middleware/validate';
import { channelWebhookSchema } from '@istays/shared';
import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';
import { logAudit } from '../../middleware/audit-log';
import { mockIncomingBookingPayload } from '../../services/channel-manager';
import { z } from 'zod';

export const channelsRouter = Router();

// Public Webhook Ingestion
// In production, validate via HMAC signature or IP whitelist per provider
channelsRouter.post('/webhooks/incoming/:channel', validateRequest(channelWebhookSchema), async (req: Request, res: Response) => {
  try {
    const { channel } = req.params;
    const allowedChannels = ['booking_com', 'makemytrip', 'agoda', 'airbnb', 'expedia', 'goibibo'];
    if (!allowedChannels.includes(channel)) {
      res.status(400).json({ success: false, error: 'Unknown channel' });
      return;
    }
    await mockIncomingBookingPayload(channel, req.body);
    res.json({ success: true, message: 'Webhook received' });
  } catch (err) {
    console.error('[OTA WEBHOOK ERROR]', err);
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
});

channelsRouter.use(authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager'));

// GET /channels — mask apiKey in responses
channelsRouter.get('/', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const connections = await prisma.channelConnection.findMany({
        where: { tenantId: req.tenantId! },
        include: { mappings: true }
      });

      // Never expose raw API keys to the frontend
      const sanitized = connections.map(c => ({
        ...c,
        apiKey: c.apiKey ? '••••••' + c.apiKey.slice(-4) : '',
      }));

      res.json({ success: true, data: sanitized });
    });
  } catch (err) {
    console.error('[CHANNELS LIST ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch channels' });
  }
});

// POST /channels
const connectionSchema = z.object({
  channel: z.enum(['booking_com', 'makemytrip', 'agoda', 'airbnb', 'expedia', 'goibibo']),
  hotelId: z.string().min(1, 'Hotel ID is required'),
  apiKey: z.string().min(1, 'API Key is required'),
});

channelsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = connectionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const exists = await prisma.channelConnection.findFirst({
        where: { tenantId: req.tenantId!, channel: parsed.data.channel }
      });
      if (exists) {
        res.status(409).json({ success: false, error: 'This channel is already connected' });
        return;
      }

      const conn = await prisma.channelConnection.create({
        data: {
          tenantId: req.tenantId!,
          channel: parsed.data.channel,
          hotelId: parsed.data.hotelId,
          apiKey: parsed.data.apiKey,
          isActive: true,
        }
      });

      await logAudit(req.tenantId!, req.userId, 'CREATE', 'channel_connection', conn.id, { channel: parsed.data.channel }, req.ip || undefined);

      // Return masked key
      res.status(201).json({ success: true, data: { ...conn, apiKey: '••••••' + conn.apiKey.slice(-4) } });
    });
  } catch (err) {
    console.error('[CHANNELS CREATE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to connect channel' });
  }
});

// POST /channels/:id/mappings
const mappingSchema = z.object({
  roomTypeId: z.string().uuid('Invalid room type ID'),
  channelRoomId: z.string().min(1, 'Channel Room ID is required'),
  channelRateId: z.string().min(1, 'Channel Rate ID is required'),
});

channelsRouter.post('/:id/mappings', async (req: Request, res: Response) => {
  try {
    const parsed = mappingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.errors[0].message });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const conn = await prisma.channelConnection.findUnique({
        where: { id: req.params.id }
      });

      if (!conn || conn.tenantId !== req.tenantId) {
        res.status(404).json({ success: false, error: 'Connection not found' });
        return;
      }

      // Verify room type belongs to this tenant
      const roomType = await prisma.roomType.findFirst({
        where: { id: parsed.data.roomTypeId, tenantId: req.tenantId! }
      });
      if (!roomType) {
        res.status(404).json({ success: false, error: 'Room type not found in your property' });
        return;
      }

      const mapping = await prisma.channelRoomMapping.create({
        data: {
          connectionId: conn.id,
          roomTypeId: parsed.data.roomTypeId,
          channelRoomId: parsed.data.channelRoomId,
          channelRateId: parsed.data.channelRateId,
        }
      });

      await logAudit(req.tenantId!, req.userId, 'CREATE', 'channel_room_mapping', mapping.id, { channelRoomId: parsed.data.channelRoomId }, req.ip || undefined);

      res.status(201).json({ success: true, data: mapping });
    });
  } catch (err) {
    console.error('[CHANNEL MAPPING ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to create mapping' });
  }
});

// DELETE /channels/:id
channelsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      const conn = await prisma.channelConnection.findUnique({ where: { id: req.params.id } });
      if (!conn || conn.tenantId !== req.tenantId) {
        res.status(404).json({ success: false, error: 'Connection not found' });
        return;
      }
      await prisma.channelRoomMapping.deleteMany({ where: { connectionId: conn.id } });
      await prisma.channelConnection.delete({ where: { id: conn.id } });

      await logAudit(req.tenantId!, req.userId, 'DELETE', 'channel_connection', conn.id, { channel: conn.channel }, req.ip || undefined);

      res.json({ success: true, message: 'Channel disconnected successfully' });
    });
  } catch (err) {
    console.error('[CHANNEL DELETE ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to disconnect channel' });
  }
});
