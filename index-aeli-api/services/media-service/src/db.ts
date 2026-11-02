import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
export const pool = new pg.Pool({ connectionString: dbUrl });

export async function initDb(): Promise<void> {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS media;');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS media.media_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_type VARCHAR(100) NOT NULL, -- 'destination', 'attraction', 'program'
        owner_id UUID NOT NULL,
        url VARCHAR(500) NOT NULL,
        type VARCHAR(50) NOT NULL, -- 'photo', 'video'
        caption VARCHAR(255),
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
  } catch (err) {
    console.error('Error initializing media-service database:', err);
  }
}

