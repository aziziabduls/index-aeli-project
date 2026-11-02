import { Router } from 'express';
import { mediaController } from '../controllers/media.controller.js';
import { checkEditorRole } from '../middlewares/role.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Public routes
router.get('/media', (req, res, next) => mediaController.getMedia(req, res, next));

// Admin routes
router.post(
  '/admin/media/upload',
  checkEditorRole,
  upload.single('file'),
  (req, res, next) => mediaController.uploadMedia(req, res, next)
);

router.delete(
  '/admin/media/:id',
  checkEditorRole,
  (req, res, next) => mediaController.deleteMedia(req, res, next)
);

export default router;

