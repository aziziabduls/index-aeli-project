import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
export const pool = new pg.Pool({ connectionString: dbUrl });

export async function initDb(): Promise<void> {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS content;');

    // Destinations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content.destinations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL,
        overview TEXT,
        best_time_to_visit VARCHAR(255),
        is_popular BOOLEAN DEFAULT false,
        status VARCHAR(50) DEFAULT 'published',
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure destinations table has image and gallery columns
    await pool.query(`
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS image VARCHAR(500);
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS gallery TEXT[];
    `);

    // Ensure destinations table has quick facts and weather columns
    await pool.query(`
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS capital VARCHAR(255);
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS population VARCHAR(255);
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS language VARCHAR(255);
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS timezone VARCHAR(255);
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS weather_temperature VARCHAR(255);
      ALTER TABLE content.destinations ADD COLUMN IF NOT EXISTS weather_condition VARCHAR(255);
    `);

    // Attractions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content.attractions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        destination_id UUID REFERENCES content.destinations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        location_label VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        about TEXT,
        historical_background TEXT,
        operational_hours VARCHAR(255),
        latitude DECIMAL,
        longitude DECIMAL,
        entrance_access_info TEXT,
        facilities TEXT[],
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ensure attractions table has image and gallery columns
    await pool.query(`
      ALTER TABLE content.attractions ADD COLUMN IF NOT EXISTS image VARCHAR(500);
      ALTER TABLE content.attractions ADD COLUMN IF NOT EXISTS gallery TEXT[];
      ALTER TABLE content.attractions ADD COLUMN IF NOT EXISTS created_by UUID;
      ALTER TABLE content.attractions ADD COLUMN IF NOT EXISTS updated_by UUID;
    `);

    // CTA Sections table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content.cta_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scope VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        button_text VARCHAR(100),
        button_link VARCHAR(255),
        status VARCHAR(50) DEFAULT 'published',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // App Config table (singleton id = 1)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS content.app_config (
        id INT PRIMARY KEY DEFAULT 1,
        config JSONB NOT NULL,
        updated_by VARCHAR(255),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const defaultAppConfig = {
      tax_percent: 10,
      credentials: {
        subtitle: 'Our Credentials',
        title: 'A World of Wonders Awaits',
        items: [
          {
            icon: 'Map',
            title: 'Discover Hidden Gems',
            desc: "Explore Indonesia's untouched corners and secret spots, far from the usual tourist trails.",
          },
          {
            icon: 'Compass',
            title: 'Explore Unique Experiences',
            desc: "Authentic adventures curated to showcase Indonesia's rich culture and vibrant nature.",
          },
          {
            icon: 'Users',
            title: 'Connect Local Cultures',
            desc: "Support local communities through tourism. We champion homestays, local guides, and community-based enterprises to ensure your trip gives back directly to the people and places you visit. Experience genuine hospitality and preserve Indonesia's cultural heritage together.",
          },
          {
            icon: 'Trees',
            title: 'Sustain For Better Future',
            desc: "Protect the environment and support local communities through responsible tourism. We partner with eco-conscious operators, minimize waste, and promote conservation efforts to ensure your journey contributes to a sustainable future for Indonesia's natural treasures.",
          },
        ],
      },
      contact: {
        title: 'Get in Touch',
        description:
          'Have questions about our programs, destinations, or want to customize your journey? Our team of local experts is ready to help you plan the perfect Indonesian adventure.',
        address: 'Kuningan Cyber, Block C2-12, South Jakarta, Indonesia',
        phone: '+62 (21) 8000-AELI',
        email: 'explore@index-aeli.id',
        business_hours: {
          weekday: '09:00 - 18:00 (WIB)',
          saturday: '10:00 - 15:00 (WIB)',
          sunday: 'Closed',
        },
      },
      footer: {
        brand_description:
          "INDEX-AELI is Indonesia's premier tourism landing platform. We connect worldwide travelers with curated premium program and unforgettable tropical attractions across the Indonesian archipelago.",
        address: 'Kuningan Cyber, Block C2-12, South Jakarta, Indonesia',
        phone: '+62 (21) 8000-AELI',
        email: 'explore@index-aeli.id',
        quick_links: [
          { label: 'Popular Destinations', url: '/#destinations' },
          { label: 'Top Attractions', url: '/#attractions' },
          { label: 'Curated Programs', url: '/#program' },
          { label: 'About INDEX-AELI', url: '/#about' },
          { label: 'Secure Booking', url: '/booking' },
        ],
        support_links: [
          { label: 'Help Center / FAQ', url: '#' },
          { label: 'Safety Guidelines', url: '#' },
          { label: 'Terms of Service', url: '#' },
          { label: 'Privacy Policy', url: '#' },
          { label: 'Refund & Cancellation Policy', url: '#' },
        ],
        copyright_text: 'INDEX-AELI Indonesia. All rights reserved.',
      },
    };

    await pool.query(
      `INSERT INTO content.app_config (id, config)
       VALUES (1, $1::jsonb)
       ON CONFLICT (id) DO NOTHING;`,
      [JSON.stringify(defaultAppConfig)]
    );
  } catch (err) {
    console.error('Error initializing content-service database:', err);
  }
}

