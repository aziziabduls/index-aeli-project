import { Router } from 'express';
import { attractionController } from '../controllers/attraction.controller.js';
import { checkEditorRole, checkAdminRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/attractions', (req, res, next) => attractionController.getAllAttractions(req, res, next));
router.get('/attractions/:idOrSlug', (req, res, next) => attractionController.getAttractionByIdOrSlug(req, res, next));

// Admin routes
router.get('/admin/attractions', checkEditorRole, (req, res, next) => attractionController.getAdminAttractions(req, res, next));
router.post('/admin/attractions', checkEditorRole, (req, res, next) => attractionController.createAttraction(req, res, next));
router.put('/admin/attractions/:id', checkEditorRole, (req, res, next) => attractionController.updateAttraction(req, res, next));
router.patch('/admin/attractions/:id/status', checkAdminRole, (req, res, next) => attractionController.updateStatus(req, res, next));
router.delete('/admin/attractions/:id', checkAdminRole, (req, res, next) => attractionController.deleteAttraction(req, res, next));

export default router;

