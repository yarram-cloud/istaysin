import { validateRequest } from '../../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '@istays/shared';
import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { prisma } from '../../config/database';

export const usersRouter = Router();
usersRouter.use(authenticate);

// PATCH /users/profile
usersRouter.patch('/profile', validateRequest(updateProfileSchema), async (req: Request, res: Response) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;
    const user = await prisma.globalUser.update({
      where: { id: req.userId },
      data: {
        ...(fullName && { fullName }),
        ...(phone && { phone }),
        ...(avatarUrl && { avatarUrl }),
      },
      select: { id: true, email: true, fullName: true, phone: true, avatarUrl: true },
    });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

// PATCH /users/change-password
usersRouter.patch('/change-password', validateRequest(changePasswordSchema), async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Current and new passwords are required' });
      return;
    }

    const user = await prisma.globalUser.findUnique({ where: { id: req.userId } });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const bcryptModule = await import('bcryptjs');
    const valid = await bcryptModule.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Current password is incorrect' });
      return;
    }

    const newHash = await bcryptModule.hash(newPassword, 12);
    await prisma.globalUser.update({ where: { id: req.userId }, data: { passwordHash: newHash } });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});
