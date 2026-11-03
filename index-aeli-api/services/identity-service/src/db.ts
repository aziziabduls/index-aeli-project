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
    `);

    // Seed initial superadmin if table is empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM identity.users;');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('Seeding root superadmin user in identity service...');
      const hash = await bcrypt.hash('superadminpassword', 10);
      await pool.query(
        'INSERT INTO identity.users (email, password_hash, role) VALUES ($1, $2, $3);',
        ['superadmin@indexaeli.com', hash, 'super_admin']
      );
      console.log('Root superadmin seeded successfully.');
    }
  } catch (err) {
    console.error('Error initializing identity-service database:', err);
  }
}

