import { Router } from 'express';
import { appConfigController } from '../controllers/app-config.controller.js';
import { checkSuperAdminRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public route for web & cms read
router.get('/app-config', (req, res, next) => appConfigController.getAppConfig(req, res, next));

// Superadmin routes for CMS read & write
router.get('/admin/app-config', checkSuperAdminRole, (req, res, next) =>
  appConfigController.getAppConfig(req, res, next)
);
router.put('/admin/app-config', checkSuperAdminRole, (req, res, next) =>
  appConfigController.updateAppConfig(req, res, next)
);

export default router;

