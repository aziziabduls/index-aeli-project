import { Router } from 'express';
import { destinationController } from '../controllers/destination.controller.js';

const router = Router();

router.get('/destinations/:id', (req, res, next) => destinationController.getInternalDestination(req, res, next));

export default router;

