import { Request, Response, NextFunction } from 'express';
import { registrationService } from '../services/registration.service.js';

export class RegistrationController {
  async getRegistrations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await registrationService.getRegistrations();
      return res.json({
        success: true,
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async createRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        booking_code,
        customer_name,
        customer_email,
        customer_phone,
        program_name,
        experience_name,
        pax,
        gross_amount,
        payment_method,
        billing_status
      } = req.body;

      const data = await registrationService.createRegistration({
        booking_code,
        customer_name,
        customer_email,
        customer_phone,
        program_name,
        experience_name,
        pax,
        gross_amount,
        payment_method,
        billing_status
      });

      return res.json({
        success: true,
        message: 'Traveler registration recorded successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

export const registrationController = new RegistrationController();

