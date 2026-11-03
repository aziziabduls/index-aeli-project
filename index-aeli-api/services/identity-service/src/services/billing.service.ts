import { pool } from '../db.js';
import { AppError } from '../errors.js';

export interface PaymentMethodInput {
  type: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  holder_name: string;
}

export class BillingService {
  async getBillingOverview() {
    let { rows } = await pool.query(
      `SELECT id, plan_name, billing_cycle, status, renewal_date, payment_methods, invoices, updated_at
       FROM identity.billing_profiles
       ORDER BY created_at DESC
       LIMIT 1;`
    );

    if (rows.length === 0) {
      const defaultPaymentMethods = JSON.stringify([
        {
          id: 'pm_1',
          type: 'card',
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2028,
          holder_name: 'INDEX-AELI Finance',
          is_default: true
        }
      ]);
      const defaultInvoices = JSON.stringify([
        {
          id: 'INV-2026-001',
          date: '2026-11-01',
          amount: 2500000,
          currency: 'IDR',
          tax_percent: 11,
          status: 'paid',
          description: 'INDEX-AELI Operator Pro - November 2026'
        }
      ]);
      const insertRes = await pool.query(
        `INSERT INTO identity.billing_profiles (plan_name, billing_cycle, status, payment_methods, invoices)
         VALUES ($1, $2, $3, $4, $5) RETURNING *;`,
        ['INDEX-AELI Operator Pro', 'monthly', 'active', defaultPaymentMethods, defaultInvoices]
      );
      rows = insertRes.rows;
    }

    const billing = rows[0];

    // Query platform metrics for quota visualization
    const [progRes, destRes, mediaRes, taxRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as count FROM program.programs WHERE status = 'published';`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT COUNT(*)::int as count FROM content.destinations WHERE status = 'published';`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT COUNT(*)::int as count FROM media.media_assets;`).catch(() => ({ rows: [{ count: 0 }] })),
      pool.query(`SELECT config->>'tax_percent' as tax_percent FROM content.app_config WHERE id = 1;`).catch(() => ({ rows: [{ tax_percent: '11' }] }))
    ]);

    const taxPercent = parseFloat(taxRes.rows[0]?.tax_percent || '11');

    return {
      ...billing,
      tax_percent: isNaN(taxPercent) ? 11 : taxPercent,
      quotas: {
        programs: {
          used: progRes.rows[0]?.count || 0,
          limit: 100,
          label: 'Active Programs'
        },
        destinations: {
          used: destRes.rows[0]?.count || 0,
          limit: 50,
          label: 'Published Destinations'
        },
        media: {
          used: mediaRes.rows[0]?.count || 0,
          limit: 500,
          label: 'Media Assets'
        }
      }
    };
  }

  async addPaymentMethod(data: PaymentMethodInput) {
    if (!data.last4 || !data.brand || !data.holder_name) {
      throw new AppError('Incomplete payment method details', 400);
    }

    const overview = await this.getBillingOverview();
    const currentMethods = overview.payment_methods || [];

    const newMethod = {
      id: `pm_${Date.now()}`,
      type: data.type || 'card',
      brand: data.brand.toLowerCase(),
      last4: data.last4,
      exp_month: data.exp_month || 12,
      exp_year: data.exp_year || 2028,
      holder_name: data.holder_name,
      is_default: currentMethods.length === 0
    };

    const updatedMethods = [...currentMethods, newMethod];

    await pool.query(
      `UPDATE identity.billing_profiles
       SET payment_methods = $1, updated_at = NOW()
       WHERE id = $2;`,
      [JSON.stringify(updatedMethods), overview.id]
    );

    return newMethod;
  }

  async deletePaymentMethod(paymentMethodId: string) {
    const overview = await this.getBillingOverview();
    const currentMethods: any[] = overview.payment_methods || [];

    const filtered = currentMethods.filter((m) => m.id !== paymentMethodId);

    // If removed method was default, make the first one default
    if (filtered.length > 0 && !filtered.some((m) => m.is_default)) {
      filtered[0].is_default = true;
    }

    await pool.query(
      `UPDATE identity.billing_profiles
       SET payment_methods = $1, updated_at = NOW()
       WHERE id = $2;`,
      [JSON.stringify(filtered), overview.id]
    );

    return { success: true, removedId: paymentMethodId };
  }

  async updatePlan(planName: string, billingCycle: string) {
    const overview = await this.getBillingOverview();

    const { rows } = await pool.query(
      `UPDATE identity.billing_profiles
       SET plan_name = $1, billing_cycle = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *;`,
      [planName, billingCycle, overview.id]
    );

    return rows[0];
  }
}

export const billingService = new BillingService();

