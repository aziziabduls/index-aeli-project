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

      CREATE TABLE IF NOT EXISTS identity.roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        key VARCHAR(100) UNIQUE NOT NULL,
        group_name VARCHAR(100) NOT NULL DEFAULT 'Custom roles',
        access_level VARCHAR(50) NOT NULL DEFAULT 'Scoped',
        permission_sets TEXT[] NOT NULL DEFAULT '{}',
        description TEXT,
        owner VARCHAR(100) NOT NULL DEFAULT 'System',
        status VARCHAR(50) NOT NULL DEFAULT 'Active',
        is_system BOOLEAN NOT NULL DEFAULT false,
        last_review TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS identity.web_registrations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_code VARCHAR(100) UNIQUE NOT NULL,
        order_id VARCHAR(100),
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        program_name VARCHAR(255) NOT NULL,
        experience_name VARCHAR(255) NOT NULL,
        location_name VARCHAR(255) DEFAULT 'Indonesia',
        pax INT NOT NULL DEFAULT 1,
        gross_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(100) NOT NULL DEFAULT 'other_qris',
        issuer VARCHAR(100),
        payment_token VARCHAR(255),
        payment_url TEXT,
        billing_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
        joined TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE identity.web_registrations ADD COLUMN IF NOT EXISTS order_id VARCHAR(100);
      ALTER TABLE identity.web_registrations ADD COLUMN IF NOT EXISTS location_name VARCHAR(255) DEFAULT 'Indonesia';
      ALTER TABLE identity.web_registrations ADD COLUMN IF NOT EXISTS payment_token VARCHAR(255);
      ALTER TABLE identity.web_registrations ADD COLUMN IF NOT EXISTS payment_url TEXT;
      ALTER TABLE identity.web_registrations ADD COLUMN IF NOT EXISTS issuer VARCHAR(100);

      CREATE TABLE IF NOT EXISTS identity.transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id VARCHAR(100) UNIQUE NOT NULL,
        booking_code VARCHAR(100) UNIQUE NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        program_name VARCHAR(255) NOT NULL,
        experience_name VARCHAR(255) NOT NULL,
        location_name VARCHAR(255) DEFAULT 'Indonesia',
        pax INT NOT NULL DEFAULT 1,
        gross_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        platform_fee NUMERIC(15, 2) NOT NULL DEFAULT 0,
        net_payout NUMERIC(15, 2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(100) NOT NULL DEFAULT 'other_qris',
        issuer VARCHAR(100),
        payment_token VARCHAR(255),
        payment_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        raw_response JSONB DEFAULT '{}'::jsonb,
        raw_webhook JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON identity.transactions (order_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_booking_code ON identity.transactions (booking_code);
      CREATE INDEX IF NOT EXISTS idx_transactions_status ON identity.transactions (status);

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

      await pool.query(
        `INSERT INTO identity.payout_profiles (
           available_balance, pending_balance, total_paid_out,
           auto_payout_enabled, auto_payout_schedule,
           bank_accounts, recent_purchases, payout_history
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          0.00,
          0.00,
          0.00,
          true,
          'daily',
          defaultBankAccounts,
          '[]',
          '[]'
        ]
      );
    }

    // Seed default roles if empty
    const roleCount = await pool.query('SELECT COUNT(*) FROM identity.roles;');
    if (parseInt(roleCount.rows[0].count, 10) === 0) {
      console.log('Seeding default roles in identity service...');
      await pool.query(`
        INSERT INTO identity.roles (name, key, group_name, access_level, permission_sets, description, owner, status, is_system, last_review) VALUES
        ('Super Admin', 'super_admin', 'System roles', 'Full', ARRAY['Users', 'Roles', 'Settings', 'Billing', 'Reports', 'Integrations', 'Audit Logs'], 'Complete administrative ownership with unrestricted system access.', 'System', 'Active', true, NOW()),
        ('Admin', 'admin', 'System roles', 'Full', ARRAY['Users', 'Settings', 'Reports', 'Billing', 'Integrations'], 'Administrative management for operational workflows, users, and billing.', 'System', 'Active', true, NOW()),
        ('Finance Manager', 'finance', 'System roles', 'Scoped', ARRAY['Finance', 'Transactions', 'Payout', 'Billing', 'Reports'], 'Financial oversight: bookings, payout disbursements, banking accounts, and revenue audit.', 'System', 'Active', true, NOW()),
        ('Content Editor', 'content_editor', 'System roles', 'Scoped', ARRAY['Destinations', 'Attractions', 'Programs', 'Media', 'Categories', 'Providers'], 'Publish and manage travel destinations, attractions, and tour catalog contents.', 'System', 'Active', true, NOW()),
        ('Viewer', 'viewer', 'System roles', 'Read only', ARRAY['Reports', 'Dashboards', 'Destinations', 'Programs'], 'Read-only access for auditing and reviewing analytics and public catalog items.', 'System', 'Active', true, NOW()),
        ('Manager', 'manager', 'Needs review', 'Scoped', ARRAY['Users', 'Reports', 'Programs', 'Destinations'], 'Operations team leader overseeing tour schedules and assigned editors.', 'Jane Doe', 'Needs review', false, NOW() - INTERVAL '15 days'),
        ('Support Specialist', 'support', 'Custom roles', 'Scoped', ARRAY['Users', 'Reports', 'Dashboards'], 'Customer assistance personnel monitoring inquiries and traveler reservations.', 'System', 'Active', false, NOW() - INTERVAL '10 days'),
        ('Marketing Lead', 'marketing', 'Custom roles', 'Scoped', ARRAY['Reports', 'Analytics', 'Dashboards', 'CTA Banners'], 'Growth & outreach coordinator managing promo banners and visitor analytics.', 'Alex Kim', 'Active', false, NOW() - INTERVAL '5 days'),
        ('Developer', 'developer', 'Custom roles', 'Scoped', ARRAY['Integrations', 'API Keys', 'Webhooks', 'Audit Logs'], 'Technical team member managing integrations and API webhooks.', 'Chris Lee', 'Active', false, NOW() - INTERVAL '3 days');
      `);
      console.log('Default roles seeded successfully.');
    } else {
      // Ensure Finance role exists in identity.roles
      await pool.query(`
        INSERT INTO identity.roles (name, key, group_name, access_level, permission_sets, description, owner, status, is_system, last_review)
        VALUES ('Finance Manager', 'finance', 'System roles', 'Scoped', ARRAY['Finance', 'Transactions', 'Payout', 'Billing', 'Reports'], 'Financial oversight: bookings, payout disbursements, banking accounts, and revenue audit.', 'System', 'Active', true, NOW())
        ON CONFLICT (key) DO NOTHING;
      `);
    }
  } catch (err) {
    console.error('Error initializing identity-service database:', err);
  }
}
