import { Router } from 'express';
import { billingController } from '../controllers/billing.controller.js';

const router = Router();

router.get('/billing', (req, res, next) => billingController.getOverview(req, res, next));
router.post('/billing/payment-methods', (req, res, next) => billingController.addPaymentMethod(req, res, next));
router.delete('/billing/payment-methods/:id', (req, res, next) => billingController.deletePaymentMethod(req, res, next));
router.put('/billing/plan', (req, res, next) => billingController.updatePlan(req, res, next));

export default router;

