import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';

export class NotificationController {
  async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.header('x-user-id');
      const data = await notificationService.getNotifications(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await notificationService.markAsRead(id);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.header('x-user-id');
      const data = await notificationService.markAllAsRead(userId);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await notificationService.deleteNotification(id);
      return res.json({ success: true, message: 'Notification dismissed' });
    } catch (err) {
      next(err);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || req.header('x-user-id');
      const { preferences } = req.body;
      const data = await notificationService.updatePreferences(userId, preferences);
      return res.json({ success: true, message: 'Preferences updated', data });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();

