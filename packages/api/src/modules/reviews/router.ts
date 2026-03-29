import { Router, Request, Response } from 'express';
import { prisma, withTenant } from '../../config/database';
import { authenticate } from '../../middleware/auth';
import { resolveTenant, requireTenant } from '../../middleware/tenant-resolver';
import { authorize } from '../../middleware/rbac';

export const reviewsRouter = Router();

// Secure all routes
reviewsRouter.use(authenticate, resolveTenant, requireTenant, authorize('property_owner', 'general_manager', 'front_desk'));

// GET /reviews - List all reviews, optionally filtered
reviewsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { rating, isPublished } = req.query;

    await withTenant(req.tenantId!, async () => {
      const whereClause: any = { tenantId: req.tenantId! };
      
      if (rating) {
        whereClause.rating = parseInt(rating as string);
      }
      
      if (isPublished !== undefined) {
        whereClause.isPublished = isPublished === 'true';
      }

      const reviews = await prisma.review.findMany({
        where: whereClause,
        include: {
          booking: { select: { bookingNumber: true, checkInDate: true, checkOutDate: true } },
          guestProfile: { select: { fullName: true, email: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate aggregate stats quickly
      const aggregate = await prisma.review.aggregate({
        where: { tenantId: req.tenantId! },
        _avg: { rating: true },
        _count: { id: true },
      });

      res.json({ 
        success: true, 
        data: reviews,
        meta: {
          averageRating: aggregate._avg.rating || 0,
          totalReviews: aggregate._count.id || 0
        }
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
});

// PATCH /reviews/:id/publish - Toggle visibility of a review
reviewsRouter.patch('/:id/publish', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const { isPublished } = req.body;
    if (typeof isPublished !== 'boolean') {
      res.status(400).json({ success: false, error: 'isPublished boolean is required' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const review = await prisma.review.update({
        where: { id: req.params.id, tenantId: req.tenantId! },
        data: { isPublished },
      });

      res.json({ success: true, data: review });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update review visibility' });
  }
});

// PATCH /reviews/:id/reply - Add an owner reply to a review
reviewsRouter.patch('/:id/reply', authorize('property_owner', 'general_manager'), async (req: Request, res: Response) => {
  try {
    const { ownerReply } = req.body;
    if (!ownerReply || typeof ownerReply !== 'string') {
      res.status(400).json({ success: false, error: 'ownerReply string is required' });
      return;
    }

    await withTenant(req.tenantId!, async () => {
      const review = await prisma.review.update({
        where: { id: req.params.id, tenantId: req.tenantId! },
        data: { ownerReply },
      });

      res.json({ success: true, data: review });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to reply to review' });
  }
});

// DELETE /reviews/:id - Delete a review entirely (only owner)
reviewsRouter.delete('/:id', authorize('property_owner'), async (req: Request, res: Response) => {
  try {
    await withTenant(req.tenantId!, async () => {
      await prisma.review.delete({
        where: { id: req.params.id, tenantId: req.tenantId! },
      });

      res.json({ success: true, message: 'Review deleted successfully' });
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
});
