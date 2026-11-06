import { Request, Response, NextFunction } from 'express';
import { payoutService } from '../services/payout.service.js';

export class PayoutController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      try {
        const { hooplePaymentService } = await import('../services/hoople-payment.service.js');
        await hooplePaymentService.syncAllPendingTransactions();
      } catch (e) {
        // Non-blocking sync error
      }
      const data = await payoutService.getPayoutOverview();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async addBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { bank_name, bank_code, account_number, account_holder, branch } = req.body;
      const data = await payoutService.addBankAccount({
        bank_name,
        bank_code,
        account_number,
        account_holder,
        branch
      });
      return res.status(201).json({ success: true, message: 'Bank account added successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async deleteBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await payoutService.deleteBankAccount(id);
      return res.json({ success: true, message: 'Bank account removed successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async setPrimaryBankAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await payoutService.setPrimaryBankAccount(id);
      return res.json({ success: true, message: 'Primary bank account updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { auto_payout_enabled, auto_payout_schedule } = req.body;
      const data = await payoutService.updateSettings({
        auto_payout_enabled: Boolean(auto_payout_enabled),
        auto_payout_schedule: auto_payout_schedule || 'daily'
      });
      return res.json({ success: true, message: 'Auto-payout settings updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async withdrawFunds(req: Request, res: Response, next: NextFunction) {
    try {
      const { amount } = req.body;
      const numAmount = amount ? parseFloat(amount) : undefined;
      const data = await payoutService.withdrawFunds(numAmount);
      return res.json({
        success: true,
        message: 'Withdrawal processed successfully to your bank account',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      try {
        const { hooplePaymentService } = await import('../services/hoople-payment.service.js');
        await hooplePaymentService.syncAllPendingTransactions();
      } catch (e) {
        // Non-blocking sync error
      }

      const data = await payoutService.getTransactions();
      return res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async recordPurchase(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        booking_code,
        program_name,
        experience_name,
        customer_name,
        customer_email,
        customer_phone,
        pax,
        gross_amount,
        payment_method
      } = req.body;
      const data = await payoutService.recordProgramPurchase({
        booking_code,
        program_name,
        experience_name,
        customer_name,
        customer_email,
        customer_phone,
        pax: parseInt(pax, 10) || 1,
        gross_amount: parseFloat(gross_amount),
        payment_method
      });
      return res.json({
        success: true,
        message: 'Program purchase revenue recorded to payout balance',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

export const payoutController = new PayoutController();
