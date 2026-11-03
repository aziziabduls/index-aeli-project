import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';

const router = Router();

router.get('/notifications', (req, res, next) => notificationController.getNotifications(req, res, next));
router.patch('/notifications/:id/read', (req, res, next) => notificationController.markAsRead(req, res, next));
router.post('/notifications/mark-all-read', (req, res, next) => notificationController.markAllAsRead(req, res, next));
router.delete('/notifications/:id', (req, res, next) => notificationController.deleteNotification(req, res, next));
router.put('/notifications/preferences', (req, res, next) => notificationController.updatePreferences(req, res, next));

export default router;

