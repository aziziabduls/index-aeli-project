import { Router } from 'express';
import { providerController } from '../controllers/provider.controller.js';
import { checkEditorRole } from '../middlewares/role.middleware.js';

const router = Router();

// Admin routes
router.get('/admin/providers', checkEditorRole, (req, res, next) => providerController.getProviders(req, res, next));
router.post('/admin/providers', checkEditorRole, (req, res, next) => providerController.createProvider(req, res, next));
router.put('/admin/providers/:id', checkEditorRole, (req, res, next) => providerController.updateProvider(req, res, next));

export default router;

