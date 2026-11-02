import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
export const pool = new pg.Pool({ connectionString: dbUrl });

export async function initDb(): Promise<void> {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS audit;');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID,
        entity_type VARCHAR(100),
        entity_id UUID,
        action VARCHAR(50),
        diff JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error('Error initializing audit database:', err);
  }
}

