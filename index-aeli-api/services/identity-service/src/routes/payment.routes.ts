import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';

const router = Router();

// 1. Create Payment (generates SNAP token & redirect URL)
router.post('/create', (req, res, next) => paymentController.createPayment(req, res, next));
router.post('/checkout', (req, res, next) => paymentController.createPayment(req, res, next));

// 2. Public Webhook Notification from Hoople Payment
router.post('/webhook', (req, res, next) => paymentController.handleWebhook(req, res, next));

// 3. Status Check (by Order ID)
router.get('/status/:orderId', (req, res, next) => paymentController.getPaymentStatus(req, res, next));
router.get('/status', (req, res, next) => paymentController.getPaymentStatus(req, res, next));
router.post('/status', (req, res, next) => paymentController.getPaymentStatus(req, res, next));

// 4. Refund Payment
router.post('/refund', (req, res, next) => paymentController.refundPayment(req, res, next));

// 5. Bulk Sync Pending Payments
router.get('/sync', (req, res, next) => paymentController.syncPendingPayments(req, res, next));
router.post('/sync', (req, res, next) => paymentController.syncPendingPayments(req, res, next));

export default router;

