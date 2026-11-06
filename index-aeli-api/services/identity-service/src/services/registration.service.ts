import { pool } from '../db.js';
import { payoutService } from './payout.service.js';

export interface CreateRegistrationInput {
  booking_code?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  program_name: string;
  experience_name: string;
  pax?: number;
  gross_amount: number;
  payment_method?: string;
  billing_status?: string;
}

export class RegistrationService {
  async getRegistrations() {
    const { rows } = await pool.query(
      `SELECT id, booking_code, customer_name, customer_email, customer_phone,
              program_name, experience_name, location_name, pax, gross_amount, payment_method,
              billing_status, joined, created_at
       FROM identity.web_registrations
       ORDER BY created_at DESC;`
    );

    return rows.map((r: any) => ({
      id: r.id,
      booking_code: r.booking_code,
      name: r.customer_name,
      customer_name: r.customer_name,
      email: r.customer_email,
      customer_email: r.customer_email,
      phone: r.customer_phone || '-',
      program_name: r.program_name,
      experience_name: r.experience_name,
      location_name: r.location_name || 'Indonesia',
      pax: parseInt(r.pax || '1', 10),
      gross_amount: parseFloat(r.gross_amount || '0'),
      payment_method: r.payment_method,
      billing: r.billing_status || 'Paid',
      billing_status: r.billing_status || 'Paid',
      joined: r.joined ? new Date(r.joined).toISOString() : new Date().toISOString()
    }));
  }

  async createRegistration(data: CreateRegistrationInput) {
    const bookingCode = data.booking_code || `AELI-${Math.floor(1000 + Math.random() * 9000)}-INDO`;
    const pax = Number(data.pax) || 1;
    const grossAmount = Number(data.gross_amount) || 0;
    const paymentMethod = data.payment_method || 'BCA Virtual Account';
    const billingStatus = data.billing_status || 'Paid';

    const { rows } = await pool.query(
      `INSERT INTO identity.web_registrations (
         booking_code, customer_name, customer_email, customer_phone,
         program_name, experience_name, pax, gross_amount,
         payment_method, billing_status, joined
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *;`,
      [
        bookingCode,
        data.customer_name,
        data.customer_email,
        data.customer_phone || '-',
        data.program_name,
        data.experience_name,
        pax,
        grossAmount,
        paymentMethod,
        billingStatus
      ]
    );

    // Also automatically register to payout revenue & transactions
    try {
      await payoutService.recordProgramPurchase({
        booking_code: bookingCode,
        program_name: data.program_name,
        experience_name: data.experience_name,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || '-',
        pax,
        gross_amount: grossAmount,
        payment_method: paymentMethod
      });
    } catch (err) {
      console.error('Error synchronizing registration with payout profile:', err);
    }

    const saved = rows[0];
    return {
      id: saved.id,
      booking_code: saved.booking_code,
      name: saved.customer_name,
      customer_name: saved.customer_name,
      email: saved.customer_email,
      customer_email: saved.customer_email,
      phone: saved.customer_phone,
      program_name: saved.program_name,
      experience_name: saved.experience_name,
      pax: parseInt(saved.pax || '1', 10),
      gross_amount: parseFloat(saved.gross_amount || '0'),
      payment_method: saved.payment_method,
      billing: saved.billing_status,
      billing_status: saved.billing_status,
      joined: saved.joined
    };
  }
}

export const registrationService = new RegistrationService();

