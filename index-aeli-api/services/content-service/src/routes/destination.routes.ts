import { Router } from 'express';
import { destinationController } from '../controllers/destination.controller.js';
import { checkEditorRole, checkAdminRole } from '../middlewares/role.middleware.js';

const router = Router();

// Public routes
router.get('/destinations', (req, res, next) => destinationController.getDestinations(req, res, next));
router.get('/destinations/:idOrSlug', (req, res, next) => destinationController.getDestinationByIdOrSlug(req, res, next));
router.get('/destinations/:idOrSlug/attractions', (req, res, next) => destinationController.getAttractionsForDestination(req, res, next));

// Admin routes
router.get('/admin/destinations', checkEditorRole, (req, res, next) => destinationController.getAdminDestinations(req, res, next));
router.post('/admin/destinations', checkEditorRole, (req, res, next) => destinationController.createDestination(req, res, next));
router.put('/admin/destinations/:id', checkEditorRole, (req, res, next) => destinationController.updateDestination(req, res, next));
router.patch('/admin/destinations/:id/status', checkAdminRole, (req, res, next) => destinationController.updateStatus(req, res, next));
router.delete('/admin/destinations/:id', checkAdminRole, (req, res, next) => destinationController.deleteDestination(req, res, next));

export default router;

