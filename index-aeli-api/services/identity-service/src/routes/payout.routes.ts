import { Router } from 'express';
import { payoutController } from '../controllers/payout.controller.js';

const router = Router();

router.get('/payout', (req, res, next) => payoutController.getOverview(req, res, next));
router.post('/payout/bank-accounts', (req, res, next) => payoutController.addBankAccount(req, res, next));
router.delete('/payout/bank-accounts/:id', (req, res, next) => payoutController.deleteBankAccount(req, res, next));
router.patch('/payout/bank-accounts/:id/primary', (req, res, next) => payoutController.setPrimaryBankAccount(req, res, next));
router.put('/payout/settings', (req, res, next) => payoutController.updateSettings(req, res, next));
router.post('/payout/withdraw', (req, res, next) => payoutController.withdrawFunds(req, res, next));
router.post('/payout/simulate-purchase', (req, res, next) => payoutController.recordPurchase(req, res, next));
router.get('/transactions', (req, res, next) => payoutController.getTransactions(req, res, next));
router.post('/transactions', (req, res, next) => payoutController.recordPurchase(req, res, next));
router.post('/bookings', (req, res, next) => payoutController.recordPurchase(req, res, next));

export default router;

