import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
export const pool = new pg.Pool({ connectionString: dbUrl });

export async function initDb(): Promise<void> {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS program;');

    // Providers table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program.providers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        legal_name VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255),
        contact_info JSONB,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Programs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program.programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID REFERENCES program.providers(id) ON DELETE CASCADE,
        destination_id UUID, -- reference to content.destinations(id) in other service
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        location_label VARCHAR(255) NOT NULL,
        short_description TEXT NOT NULL,
        overview TEXT,
        highlights TEXT[],
        price_min DECIMAL,
        price_max DECIMAL,
        price_unit VARCHAR(100),
        price_note TEXT,
        duration_label VARCHAR(100) NOT NULL,
        max_guest_min INTEGER,
        max_guest_max INTEGER,
        meeting_point VARCHAR(255),
        rating DECIMAL DEFAULT 0.0,
        reviews_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure attraction_id exists in programs table
    await pool.query(`
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS attraction_id UUID;
    `);

    // Ensure min_quota and max_quota columns exist in programs table
    await pool.query(`
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS min_quota INTEGER;
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS max_quota INTEGER;
      UPDATE program.programs SET min_quota = max_guest_min WHERE min_quota IS NULL AND max_guest_min IS NOT NULL;
      UPDATE program.programs SET max_quota = max_guest_max WHERE max_quota IS NULL AND max_guest_max IS NOT NULL;
      UPDATE program.programs SET max_guest_min = min_quota WHERE max_guest_min IS NULL AND min_quota IS NOT NULL;
      UPDATE program.programs SET max_guest_max = max_quota WHERE max_guest_max IS NULL AND max_quota IS NOT NULL;
    `);

    // Ensure programs table has image and gallery columns
    await pool.query(`
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS image VARCHAR(500);
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS gallery TEXT[];
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS created_by UUID;
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS updated_by UUID;
    `);

    // Ensure date_availability and available_dates exist in programs table
    await pool.query(`
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS date_availability VARCHAR(50) DEFAULT 'all_days';
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS available_dates TEXT[] DEFAULT '{}';
      UPDATE program.programs SET date_availability = 'all_days' WHERE date_availability IS NULL;
      UPDATE program.programs SET available_dates = '{}' WHERE available_dates IS NULL;
    `);

    // Itinerary Stops
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program.itinerary_stops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id UUID REFERENCES program.programs(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        unique_feature TEXT,
        activity_challenge TEXT
      );
    `);

    // Rundown Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program.rundown_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id UUID REFERENCES program.programs(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        time_label VARCHAR(100) NOT NULL,
        duration_minutes INTEGER,
        session_activity VARCHAR(255) NOT NULL,
        location VARCHAR(255),
        facilitator_notes TEXT
      );
    `);

    // Include / Exclude Items
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program.include_exclude_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id UUID REFERENCES program.programs(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL, -- 'include' | 'exclude'
        description TEXT NOT NULL
      );
    `);

    // Categories table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program.categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(255),
        gradient VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed Categories if empty
    const catCountRes = await pool.query('SELECT COUNT(*) FROM program.categories;');
    if (parseInt(catCountRes.rows[0].count, 10) === 0) {
      const initialCats = [
        {
          name: 'Adventure & Challenge',
          description: 'High-energy outdoor exploration including trekking, climbing, water sports, and challenge courses designed to push limits.',
          color: 'from-orange-500/10 to-red-500/10 text-orange-600 border-orange-500/20 bg-orange-500/5',
          gradient: 'from-orange-500 to-red-600',
        },
        {
          name: 'Cultural Immersion',
          description: 'Deep engagement with local customs, traditional crafts, heritage performing arts, historical tours, and indigenous village stays.',
          color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-500/20 bg-purple-500/5',
          gradient: 'from-purple-500 to-indigo-600',
        },
        {
          name: 'Community & Social Impact',
          description: 'Travel combined with community service, building local capacity, cultural exchanges, and environmental conservation projects.',
          color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20 bg-emerald-500/5',
          gradient: 'from-emerald-500 to-teal-600',
        },
        {
          name: 'Nature & Eco Experience',
          description: 'Eco-tourism initiatives emphasizing wildlife tracking, pristine environments, rainforest treks, and sustainable wilderness lodging.',
          color: 'from-green-500/10 to-emerald-500/10 text-green-600 border-green-500/20 bg-green-500/5',
          gradient: 'from-green-500 to-emerald-600',
        },
        {
          name: 'Culinary Journey',
          description: 'Exploration of traditional gastronomy, organic farm harvesting, culinary heritage trails, and authentic cooking workshops with local chefs.',
          color: 'from-yellow-500/10 to-amber-500/10 text-amber-700 border-amber-500/20 bg-amber-500/5',
          gradient: 'from-yellow-500 to-amber-600',
        },
      ];
      for (const cat of initialCats) {
        await pool.query(
          `INSERT INTO program.categories (name, description, color, gradient)
           VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING;`,
          [cat.name, cat.description, cat.color, cat.gradient]
        );
      }
    }
  } catch (err) {
    console.error('Error initializing program-service database:', err);
  }
}

