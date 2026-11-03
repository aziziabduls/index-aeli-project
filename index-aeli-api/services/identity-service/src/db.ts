import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
export const pool = new pg.Pool({ connectionString: dbUrl });

export async function initDb(): Promise<void> {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS identity;');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS identity.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'content_editor',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE identity.users ALTER COLUMN role SET DEFAULT 'content_editor';
      ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS bio TEXT;
      ALTER TABLE identity.users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "security": true, "updates": true, "marketing": false}'::jsonb;

      CREATE TABLE IF NOT EXISTS identity.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        link VARCHAR(255),
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS identity.billing_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        plan_name VARCHAR(100) NOT NULL DEFAULT 'INDEX-AELI Operator Pro',
        billing_cycle VARCHAR(50) NOT NULL DEFAULT 'monthly',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        renewal_date DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
        payment_methods JSONB DEFAULT '[]'::jsonb,
        invoices JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS identity.payout_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        available_balance NUMERIC(15, 2) NOT NULL DEFAULT 48500000.00,
        pending_balance NUMERIC(15, 2) NOT NULL DEFAULT 12200000.00,
        total_paid_out NUMERIC(15, 2) NOT NULL DEFAULT 135000000.00,
        auto_payout_enabled BOOLEAN NOT NULL DEFAULT true,
        auto_payout_schedule VARCHAR(50) NOT NULL DEFAULT 'daily',
        bank_accounts JSONB DEFAULT '[]'::jsonb,
        recent_purchases JSONB DEFAULT '[]'::jsonb,
        payout_history JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Seed initial superadmin if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM identity.users;');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('Seeding root superadmin user in identity service...');
      const hash = await bcrypt.hash('superadminpassword', 10);
      await pool.query(
        'INSERT INTO identity.users (email, password_hash, role, name) VALUES ($1, $2, $3, $4);',
        ['superadmin@indexaeli.com', hash, 'super_admin', 'INDEX-AELI Superadmin']
      );
      console.log('Root superadmin seeded successfully.');
    }

    // Seed sample notifications if empty
    const notifCount = await pool.query('SELECT COUNT(*) FROM identity.notifications;');
    if (parseInt(notifCount.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO identity.notifications (title, message, type, link, is_read, created_at) VALUES
        ('System Initialized', 'Welcome to the INDEX-AELI CMS platform. Your account is configured with full administrative privileges.', 'info', '/dashboard/account', false, NOW() - INTERVAL '2 hours'),
        ('Security Check', 'Role-based access controls and API Gateway proxying are active across all microservices.', 'security', '/dashboard/account', false, NOW() - INTERVAL '1 day'),
        ('Content Engine Ready', 'Destinations, attractions, and tour programs database schema verified.', 'success', '/dashboard/programs', true, NOW() - INTERVAL '2 days'),
        ('Automatic Payout Active', 'Dana pembelian program tour otomatis ditransfer ke rekening bank terdaftar.', 'info', '/dashboard/payout', true, NOW() - INTERVAL '3 days');
      `);
    }

    // Seed default billing profile if empty
    const billingCount = await pool.query('SELECT COUNT(*) FROM identity.billing_profiles;');
    if (parseInt(billingCount.rows[0].count, 10) === 0) {
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

      await pool.query(
        `INSERT INTO identity.billing_profiles (plan_name, billing_cycle, status, payment_methods, invoices)
         VALUES ($1, $2, $3, $4, $5);`,
        ['INDEX-AELI Operator Pro', 'monthly', 'active', defaultPaymentMethods, defaultInvoices]
      );
    }

    // Seed default payout profile if empty
    const payoutCount = await pool.query('SELECT COUNT(*) FROM identity.payout_profiles;');
    if (parseInt(payoutCount.rows[0].count, 10) === 0) {
      const defaultBankAccounts = JSON.stringify([
        {
          id: 'bank_1',
          bank_name: 'Bank Central Asia (BCA)',
          bank_code: 'bca',
          account_number: '8830192841',
          account_holder: 'PT INDEX AELI INDONESIA',
          branch: 'KCU Thamrin Jakarta',
          is_primary: true,
          verified: true
        },
        {
          id: 'bank_2',
          bank_name: 'Bank Mandiri',
          bank_code: 'mandiri',
          account_number: '1370019283741',
          account_holder: 'PT INDEX AELI INDONESIA',
          branch: 'Sudirman Finance',
          is_primary: false,
          verified: true
        }
      ]);

      const defaultRecentPurchases = JSON.stringify([
        {
          id: 'TRX-BK-9021',
          booking_code: 'BK-2026-9021',
          program_name: 'Komodo Dragons Expeditions & Padar Sunrise',
          customer_name: 'Michael Tan',
          customer_email: 'm.tan@gmail.com',
          pax: 4,
          gross_amount: 14000000,
          platform_fee: 700000,
          net_payout: 13300000,
          payment_method: 'BCA Virtual Account',
          date: '2026-11-03T09:15:00Z',
          status: 'cleared'
        },
        {
          id: 'TRX-BK-9018',
          booking_code: 'BK-2026-9018',
          program_name: 'Raja Ampat Coral Triangle Liveaboard',
          customer_name: 'Sarah Jenkins',
          customer_email: 'sarah.j@traveler.com',
          pax: 2,
          gross_amount: 25000000,
          platform_fee: 1250000,
          net_payout: 23750000,
          payment_method: 'Credit Card (Visa)',
          date: '2026-11-02T16:40:00Z',
          status: 'cleared'
        },
        {
          id: 'TRX-BK-9014',
          booking_code: 'BK-2026-9014',
          program_name: 'Bromo Midnight Milky Way & Jeep Safari',
          customer_name: 'Budi Santoso',
          customer_email: 'budi.s@outlook.com',
          pax: 5,
          gross_amount: 7500000,
          platform_fee: 375000,
          net_payout: 7125000,
          payment_method: 'Mandiri VA',
          date: '2026-11-02T11:20:00Z',
          status: 'pending_clearance'
        },
        {
          id: 'TRX-BK-9009',
          booking_code: 'BK-2026-9009',
          program_name: 'Ubud Rainforest Culinary & Yoga Retreat',
          customer_name: 'Chloe Dupont',
          customer_email: 'chloe.dupont@voyage.fr',
          pax: 2,
          gross_amount: 5400000,
          platform_fee: 270000,
          net_payout: 5130000,
          payment_method: 'Mastercard',
          date: '2026-11-01T14:05:00Z',
          status: 'pending_clearance'
        }
      ]);

      const defaultPayoutHistory = JSON.stringify([
        {
          id: 'PO-2026-1102',
          bank_name: 'Bank Central Asia (BCA)',
          account_number: '8830192841',
          account_holder: 'PT INDEX AELI INDONESIA',
          amount: 35000000,
          transfer_fee: 0,
          reference_code: 'BCA-WD-83921948',
          status: 'completed',
          type: 'automatic',
          processed_at: '2026-11-02T23:59:59Z'
        },
        {
          id: 'PO-2026-1025',
          bank_name: 'Bank Central Asia (BCA)',
          account_number: '8830192841',
          account_holder: 'PT INDEX AELI INDONESIA',
          amount: 50000000,
          transfer_fee: 0,
          reference_code: 'BCA-WD-74829103',
          status: 'completed',
          type: 'automatic',
          processed_at: '2026-10-25T23:59:59Z'
        },
        {
          id: 'PO-2026-1018',
          bank_name: 'Bank Central Asia (BCA)',
          account_number: '8830192841',
          account_holder: 'PT INDEX AELI INDONESIA',
          amount: 50000000,
          transfer_fee: 0,
          reference_code: 'BCA-WD-63910284',
          status: 'completed',
          type: 'automatic',
          processed_at: '2026-10-18T23:59:59Z'
        }
      ]);

      await pool.query(
        `INSERT INTO identity.payout_profiles (
           available_balance, pending_balance, total_paid_out,
           auto_payout_enabled, auto_payout_schedule,
           bank_accounts, recent_purchases, payout_history
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          48500000.00,
          12200000.00,
          135000000.00,
          true,
          'daily',
          defaultBankAccounts,
          defaultRecentPurchases,
          defaultPayoutHistory
        ]
      );
    }
  } catch (err) {
    console.error('Error initializing identity-service database:', err);
  }
}
