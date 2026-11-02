import { Router } from 'express';
import { ctaController } from '../controllers/cta.controller.js';
import { checkEditorRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/cta', (req, res, next) => ctaController.getCta(req, res, next));

// Admin routes
router.get('/admin/cta', checkEditorRole, (req, res, next) => ctaController.getAdminCta(req, res, next));
router.put('/admin/cta/:id', checkEditorRole, (req, res, next) => ctaController.updateCta(req, res, next));

export default router;

