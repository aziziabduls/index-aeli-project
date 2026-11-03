import { Request, Response, NextFunction } from 'express';
import { billingService } from '../services/billing.service.js';

export class BillingController {
  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await billingService.getBillingOverview();
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async addPaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const { type, brand, last4, exp_month, exp_year, holder_name } = req.body;
      const data = await billingService.addPaymentMethod({
        type,
        brand,
        last4,
        exp_month,
        exp_year,
        holder_name
      });
      return res.status(201).json({ success: true, message: 'Payment method added', data });
    } catch (err) {
      next(err);
    }
  }

  async deletePaymentMethod(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = await billingService.deletePaymentMethod(id);
      return res.json({ success: true, message: 'Payment method removed', data });
    } catch (err) {
      next(err);
    }
  }

  async updatePlan(req: Request, res: Response, next: NextFunction) {
    try {
      const { plan_name, billing_cycle } = req.body;
      const data = await billingService.updatePlan(plan_name, billing_cycle);
      return res.json({ success: true, message: 'Plan updated successfully', data });
    } catch (err) {
      next(err);
    }
  }
}

export const billingController = new BillingController();

