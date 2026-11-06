import { Router } from 'express';
import { roleController } from '../controllers/role.controller.js';
import { requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Read operations - available to super_admin and admin
router.get('/', requireRole('super_admin', 'admin'), (req, res, next) => roleController.getAllRoles(req, res, next));
router.get('/meta/permissions', requireRole('super_admin', 'admin'), (req, res, next) => roleController.getPermissions(req, res, next));
router.get('/:id', requireRole('super_admin', 'admin'), (req, res, next) => roleController.getRoleById(req, res, next));

// Mutation operations - restricted to super_admin
router.post('/', requireRole('super_admin'), (req, res, next) => roleController.createRole(req, res, next));
router.post('/import', requireRole('super_admin'), (req, res, next) => roleController.importRoles(req, res, next));
router.put('/:id', requireRole('super_admin'), (req, res, next) => roleController.updateRole(req, res, next));
router.patch('/:id/review', requireRole('super_admin'), (req, res, next) => roleController.reviewRole(req, res, next));
router.post('/:id/duplicate', requireRole('super_admin'), (req, res, next) => roleController.duplicateRole(req, res, next));
router.delete('/:id', requireRole('super_admin'), (req, res, next) => roleController.deleteRole(req, res, next));

export default router;

