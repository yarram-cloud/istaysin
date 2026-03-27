import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';

export const notificationsRouter = Router();
notificationsRouter.use(authenticate, resolveTenant);

// GET /notifications
notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { unreadOnly } = req.query;
    const where: any = { userId: req.userId };
    if (req.tenantId) where.tenantId = req.tenantId;
    if (unreadOnly === 'true') where.isRead = false;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.userId, isRead: false, ...(req.tenantId ? { tenantId: req.tenantId } : {}) },
    });

    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

// PATCH /notifications/:id/read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// POST /notifications/read-all
notificationsRouter.post('/read-all', async (req: Request, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, isRead: false, ...(req.tenantId ? { tenantId: req.tenantId } : {}) },
      data: { isRead: true },
    });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
  }
});
