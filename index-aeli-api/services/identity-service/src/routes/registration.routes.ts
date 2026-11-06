import { Router } from 'express';
import { registrationController } from '../controllers/registration.controller.js';

const router = Router();

router.get('/registrations', (req, res, next) => registrationController.getRegistrations(req, res, next));
router.post('/registrations', (req, res, next) => registrationController.createRegistration(req, res, next));
router.post('/bookings', (req, res, next) => registrationController.createRegistration(req, res, next));

export default router;

