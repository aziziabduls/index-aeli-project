import { Request, Response, NextFunction } from 'express';
import { hooplePaymentService } from '../services/hoople-payment.service.js';

export class PaymentController {
  async createPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        items,
        amount,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethodId,
        programName,
        experienceName,
        locationName,
        pax,
        bookingCode,
        orderId
      } = req.body;

      if (!amount || !customerName || !customerEmail) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'amount, customerName, and customerEmail are required fields'
        });
      }

      const result = await hooplePaymentService.createPayment({
        items,
        amount: Number(amount),
        customerName,
        customerEmail,
        customerPhone,
        paymentMethodId,
        programName,
        experienceName,
        locationName,
        pax: pax ? Number(pax) : 1,
        bookingCode,
        orderId
      });

      return res.status(201).json({
        success: true,
        message: 'Hoople payment created successfully',
        data: result
      });
    } catch (err: any) {
      if (err.status && err.code) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message
        });
      }
      next(err);
    }
  }

  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const orderId = req.params.orderId || (req.query.orderId as string) || (req.body && req.body.orderId);

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Missing orderId parameter'
        });
      }

      const data = await hooplePaymentService.checkPaymentStatus(orderId);
      return res.json({
        success: true,
        data
      });
    } catch (err: any) {
      if (err.status && err.code) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message
        });
      }
      next(err);
    }
  }

  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await hooplePaymentService.processPaymentWebhook(req.body);
      return res.status(200).json({
        success: true,
        message: 'Webhook processed successfully',
        data
      });
    } catch (err: any) {
      if (err.status && err.code) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message,
          errors: err.errors || {}
        });
      }
      console.error('[Payment Controller Webhook Error]:', err);
      return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: 'An unexpected error occurred during webhook processing'
      });
    }
  }

  async refundPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, amount, reason, refundKey } = req.body;
      if (!orderId || !amount) {
        return res.status(400).json({
          success: false,
          error: 'Missing required orderId or amount'
        });
      }

      const data = await hooplePaymentService.refundPayment({
        orderId,
        amount: Number(amount),
        reason,
        refundKey
      });

      return res.json({
        success: true,
        message: 'Refund request processed successfully',
        data
      });
    } catch (err: any) {
      if (err.status && err.code) {
        return res.status(err.status).json({
          success: false,
          code: err.code,
          message: err.message
        });
      }
      next(err);
    }
  }

  async syncPendingPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await hooplePaymentService.syncAllPendingTransactions();
      return res.json({
        success: true,
        message: `Synced ${result.synced} transactions with Hoople Payment (${result.cleared} cleared)`,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();

