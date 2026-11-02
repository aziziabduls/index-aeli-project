import { Router } from 'express';
import { programController } from '../controllers/program.controller.js';
import { checkEditorRole, checkAdminRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/programs', (req, res, next) => programController.getPrograms(req, res, next));
router.get('/programs/:id', (req, res, next) => programController.getProgramById(req, res, next));

// Admin routes
router.get('/admin/programs', checkEditorRole, (req, res, next) => programController.getAdminPrograms(req, res, next));
router.get('/admin/programs/:id', checkEditorRole, (req, res, next) => programController.getAdminProgramById(req, res, next));
router.post('/admin/programs', checkEditorRole, (req, res, next) => programController.createProgram(req, res, next));
router.put('/admin/programs/:id', checkEditorRole, (req, res, next) => programController.updateProgram(req, res, next));
router.patch('/admin/programs/:id/status', checkAdminRole, (req, res, next) => programController.updateStatus(req, res, next));

export default router;

