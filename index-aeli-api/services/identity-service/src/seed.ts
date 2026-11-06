import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from './db.js';

dotenv.config();

export async function runSeed() {
  console.log('🚀 Starting INDEX-AELI Master Database Seeding...\n');

  try {
    // ==========================================
    // 1. SCHEMAS INITIALIZATION
    // ==========================================
    await pool.query('CREATE SCHEMA IF NOT EXISTS identity;');
    await pool.query('CREATE SCHEMA IF NOT EXISTS content;');
    await pool.query('CREATE SCHEMA IF NOT EXISTS program;');
    await pool.query('CREATE SCHEMA IF NOT EXISTS media;');
    await pool.query('CREATE SCHEMA IF NOT EXISTS audit;');

    // ==========================================
    // 2. IDENTITY TABLES
    // ==========================================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS identity.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        phone VARCHAR(50),
        bio TEXT,
        role VARCHAR(50) NOT NULL DEFAULT 'content_editor',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        notification_preferences JSONB DEFAULT '{"email": true, "security": true, "updates": true, "marketing": false}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

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
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        program_name VARCHAR(255) NOT NULL,
        experience_name VARCHAR(255) NOT NULL,
        location_name VARCHAR(255) DEFAULT 'Indonesia',
        pax INT NOT NULL DEFAULT 1,
        gross_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(100) NOT NULL DEFAULT 'BCA Virtual Account',
        billing_status VARCHAR(50) NOT NULL DEFAULT 'Paid',
        joined TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      ALTER TABLE identity.web_registrations ADD COLUMN IF NOT EXISTS location_name VARCHAR(255) DEFAULT 'Indonesia';
    `);

    // ==========================================
    // 3. CONTENT TABLES (Destinations & Attractions)
    // ==========================================
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
        image VARCHAR(500),
        gallery TEXT[],
        capital VARCHAR(255),
        population VARCHAR(255),
        language VARCHAR(255),
        timezone VARCHAR(255),
        weather_temperature VARCHAR(255),
        weather_condition VARCHAR(255),
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

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
        image VARCHAR(500),
        gallery TEXT[],
        status VARCHAR(50) DEFAULT 'published',
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ==========================================
    // 4. PROGRAM TABLES (Providers, Categories, Programs)
    // ==========================================
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

      CREATE TABLE IF NOT EXISTS program.categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        color VARCHAR(255),
        gradient VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS program.programs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provider_id UUID REFERENCES program.providers(id) ON DELETE CASCADE,
        destination_id UUID,
        attraction_id UUID,
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
        min_quota INTEGER,
        max_quota INTEGER,
        max_guest_min INTEGER,
        max_guest_max INTEGER,
        meeting_point VARCHAR(255),
        rating DECIMAL DEFAULT 0.0,
        reviews_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'published',
        image VARCHAR(500),
        gallery TEXT[],
        date_availability VARCHAR(50) DEFAULT 'all_days',
        available_dates TEXT[] DEFAULT '{}',
        created_by UUID,
        updated_by UUID,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS program.itinerary_stops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id UUID REFERENCES program.programs(id) ON DELETE CASCADE,
        order_index INTEGER NOT NULL,
        location_name VARCHAR(255) NOT NULL,
        unique_feature TEXT,
        activity_challenge TEXT
      );

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

      CREATE TABLE IF NOT EXISTS program.include_exclude_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        program_id UUID REFERENCES program.programs(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL
      );
    `);

    // ==========================================
    // 5. SEED ROLES & USERS
    // ==========================================
    const roles = [
      {
        name: 'Super Admin',
        key: 'super_admin',
        group_name: 'System roles',
        access_level: 'Global',
        permission_sets: ['users', 'roles', 'programs', 'locations', 'experiences', 'finance', 'payout', 'config', 'content', 'audit'],
        description: 'Ultimate system administrator with uninhibited control over the entire INDEX-AELI platform.',
        is_system: true
      },
      {
        name: 'Admin',
        key: 'admin',
        group_name: 'Administrative roles',
        access_level: 'Regional',
        permission_sets: ['users', 'roles', 'programs', 'locations', 'experiences', 'finance', 'payout', 'content'],
        description: 'Platform administrator with operations, provider onboarding, and financial review rights.',
        is_system: false
      },
      {
        name: 'Finance Manager',
        key: 'finance',
        group_name: 'Finance roles',
        access_level: 'Scoped',
        permission_sets: ['finance', 'payout', 'transactions', 'bank_accounts'],
        description: 'Manages incoming web bookings, provider revenue payouts, bank settlements, and billing.',
        is_system: false
      },
      {
        name: 'Content Editor',
        key: 'content_editor',
        group_name: 'Content roles',
        access_level: 'Scoped',
        permission_sets: ['programs', 'locations', 'experiences', 'content'],
        description: 'Can draft, curate, and publish locations, attractions, and tour learning programs.',
        is_system: false
      },
      {
        name: 'Viewer',
        key: 'viewer',
        group_name: 'Read-only roles',
        access_level: 'Scoped',
        permission_sets: ['read_only'],
        description: 'Read-only access across the dashboard metrics and public content.',
        is_system: false
      }
    ];

    for (const r of roles) {
      await pool.query(
        `INSERT INTO identity.roles (name, key, group_name, access_level, permission_sets, description, is_system, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (key) DO UPDATE
         SET name = EXCLUDED.name,
             permission_sets = EXCLUDED.permission_sets,
             description = EXCLUDED.description,
             updated_at = NOW();`,
        [r.name, r.key, r.group_name, r.access_level, r.permission_sets, r.description, r.is_system]
      );
    }
    console.log('✅ Identity roles seeded (super_admin, admin, finance, content_editor, viewer).');

    const users = [
      { email: 'superadmin@indexaeli.com', name: 'Super Admin', role: 'super_admin', phone: '+62 811-0001-9001', password: 'superadminpassword' },
      { email: 'admin@indexaeli.com', name: 'Operations Admin', role: 'admin', phone: '+62 812-8889-1002', password: 'adminpassword' },
      { email: 'finance@indexaeli.com', name: 'Finance Lead', role: 'finance', phone: '+62 813-7771-4003', password: 'financepassword' },
      { email: 'editor@indexaeli.com', name: 'Content Specialist', role: 'content_editor', phone: '+62 815-6662-7004', password: 'editorpassword' },
      { email: 'viewer@indexaeli.com', name: 'Demo Viewer', role: 'viewer', phone: '+62 816-5553-8005', password: 'viewerpassword' }
    ];

    for (const u of users) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await pool.query(
        `INSERT INTO identity.users (email, password_hash, name, role, phone, status, updated_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())
         ON CONFLICT (email) DO UPDATE
         SET role = EXCLUDED.role,
             password_hash = EXCLUDED.password_hash,
             name = EXCLUDED.name,
             phone = EXCLUDED.phone,
             status = 'active',
             updated_at = NOW();`,
        [u.email, passwordHash, u.name, u.role, u.phone]
      );
    }
    console.log('✅ Core system users seeded.');

    // ==========================================
    // 6. SEED LOCATIONS (content.destinations)
    // ==========================================
    const destinations = [
      {
        slug: 'bali',
        name: 'Bali',
        description: 'The legendary Island of the Gods, famous for forested volcanic mountains, iconic rice paddies, beaches, and coral reefs.',
        overview: 'Bali is Indonesia’s most celebrated cultural gem, providing a blend of spiritual Hindu temples, thrilling marine sports, and experiential retreats.',
        best_time_to_visit: 'April to October (Dry Season)',
        is_popular: true,
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
        ],
        capital: 'Denpasar',
        population: '4.3 Million',
        language: 'Balinese & Indonesian',
        timezone: 'GMT+8 (WITA)',
        weather_temperature: '28°C',
        weather_condition: 'Sunny & Tropical'
      },
      {
        slug: 'jakarta',
        name: 'Jakarta',
        description: 'The dynamic, sprawling capital of Indonesia. A fascinating melting pot of modern skyscrapers, historic colonial quarters, and rich heritage.',
        overview: 'Special Capital Region of Jakarta stands as the political, economic, and cultural epicenter of Indonesia.',
        best_time_to_visit: 'June to September',
        is_popular: false,
        image: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80'
        ],
        capital: 'Jakarta',
        population: '10.5 Million',
        language: 'Indonesian (Betawi)',
        timezone: 'GMT+7 (WIB)',
        weather_temperature: '31°C',
        weather_condition: 'Partly Cloudy'
      },
      {
        slug: 'yogyakarta',
        name: 'Yogyakarta',
        description: 'The soul of Java, renowned as a center for classical Javanese fine art and culture, from batik and ballet to traditional puppetry.',
        overview: 'Yogyakarta is the only Indonesian royal province still ruled by a monarch, retaining centuries-old court arts and UNESCO World Heritage temples.',
        best_time_to_visit: 'May to October',
        is_popular: true,
        image: 'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=800&q=80'
        ],
        capital: 'Yogyakarta',
        population: '3.8 Million',
        language: 'Javanese & Indonesian',
        timezone: 'GMT+7 (WIB)',
        weather_temperature: '27°C',
        weather_condition: 'Tropical Warm'
      },
      {
        slug: 'bandung',
        name: 'Bandung',
        description: 'Nicknamed the Paris of Java, Bandung is situated on a highland plateau, offering a cooler climate, volcanoes, and tea plantations.',
        overview: 'Highland city framed by dramatic active craters and lush pine forests, creating a premier outbound adventure destination.',
        best_time_to_visit: 'May to September',
        is_popular: false,
        image: 'https://images.unsplash.com/photo-1611638281871-1063d3e76e1f?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1579294819770-5b1285074b62?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1620127252536-03bdfcf6d5c3?auto=format&fit=crop&w=800&q=80'
        ],
        capital: 'Bandung',
        population: '2.5 Million',
        language: 'Sundanese & Indonesian',
        timezone: 'GMT+7 (WIB)',
        weather_temperature: '23°C',
        weather_condition: 'Cool & Humid'
      },
      {
        slug: 'lombok',
        name: 'Lombok',
        description: 'An unspoiled paradise east of Bali, known for its pristine white-sand beaches, crystal clear waters, Gili islands, and Mount Rinjani.',
        overview: 'Lombok offers pristine marine ecosystems, turtle havens, and the dramatic trekking routes of Mount Rinjani.',
        best_time_to_visit: 'May to October',
        is_popular: true,
        image: 'https://images.unsplash.com/photo-1530948990335-1eb93cbe6430?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1530948990335-1eb93cbe6430?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=800&q=80'
        ],
        capital: 'Mataram',
        population: '3.5 Million',
        language: 'Sasak & Indonesian',
        timezone: 'GMT+8 (WITA)',
        weather_temperature: '29°C',
        weather_condition: 'Tropical Breeze'
      },
      {
        slug: 'labuan-bajo',
        name: 'Labuan Bajo',
        description: 'The gateway to Komodo National Park. A breathtaking fishing town surrounded by dramatic hills, pink beaches, and legendary giant dragons.',
        overview: 'Flores maritime crown jewel, renowned globally for the Komodo dragon, Padar viewpoints, and vibrant coral marine reserves.',
        best_time_to_visit: 'April to November',
        is_popular: true,
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1530948990335-1eb93cbe6430?auto=format&fit=crop&w=800&q=80'
        ],
        capital: 'Labuan Bajo',
        population: '250,000',
        language: 'Manggarai & Indonesian',
        timezone: 'GMT+8 (WITA)',
        weather_temperature: '30°C',
        weather_condition: 'Sunny'
      },
      {
        slug: 'surabaya',
        name: 'Surabaya',
        description: 'The City of Heroes. East Java industrial heart and second largest metropolis, combining modern harbor terminals and colonial heritage.',
        overview: 'Dynamic gateway to Mount Bromo and Madura island, rich in revolutionary independence history.',
        best_time_to_visit: 'July to October',
        is_popular: false,
        image: 'https://images.unsplash.com/photo-1566176553949-872b2a73e04e?w=1200&q=80',
        gallery: [
          'https://images.unsplash.com/photo-1601999109332-542b18dbec57?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1589979482837-e74f2e145060?auto=format&fit=crop&w=800&q=80'
        ],
        capital: 'Surabaya',
        population: '3.1 Million',
        language: 'Javanese & Indonesian',
        timezone: 'GMT+7 (WIB)',
        weather_temperature: '32°C',
        weather_condition: 'Hot & Humid'
      }
    ];

    const destMap = new Map<string, string>(); // slug -> UUID

    for (const d of destinations) {
      const res = await pool.query(
        `INSERT INTO content.destinations (
           name, slug, description, overview, best_time_to_visit, is_popular,
           image, gallery, capital, population, language, timezone,
           weather_temperature, weather_condition, status, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'published', NOW())
         ON CONFLICT (slug) DO UPDATE
         SET name = EXCLUDED.name,
             description = EXCLUDED.description,
             overview = EXCLUDED.overview,
             best_time_to_visit = EXCLUDED.best_time_to_visit,
             is_popular = EXCLUDED.is_popular,
             image = EXCLUDED.image,
             gallery = EXCLUDED.gallery,
             capital = EXCLUDED.capital,
             population = EXCLUDED.population,
             language = EXCLUDED.language,
             timezone = EXCLUDED.timezone,
             weather_temperature = EXCLUDED.weather_temperature,
             weather_condition = EXCLUDED.weather_condition,
             updated_at = NOW()
         RETURNING id, slug;`,
        [
          d.name, d.slug, d.description, d.overview, d.best_time_to_visit, d.is_popular,
          d.image, d.gallery, d.capital, d.population, d.language, d.timezone,
          d.weather_temperature, d.weather_condition
        ]
      );
      destMap.set(d.slug, res.rows[0].id);
    }
    console.log(`✅ ${destinations.length} Locations (destinations) seeded.`);

    // ==========================================
    // 7. SEED EXPERIENCES (content.attractions)
    // ==========================================
    const attractions = [
      {
        slug: 'tanah-lot',
        destSlug: 'bali',
        name: 'Tanah Lot Temple',
        location_label: 'Tabanan, Bali',
        description: 'An iconic ancient Hindu pilgrimage temple perched on a unique rock formation off the coast of Bali, famous for spectacular sunset views.',
        about: 'Built in the 16th century by Danghyang Nirartha, Tanah Lot is a critical part of Balinese spiritual sea mythology.',
        operational_hours: '06:00 AM - 07:00 PM',
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
        facilities: ['Parking Lot', 'Souvenir Shops', 'Washrooms', 'Restaurants', 'Guides']
      },
      {
        slug: 'ubud-monkey-forest',
        destSlug: 'bali',
        name: 'Ubud Monkey Forest',
        location_label: 'Ubud, Bali',
        description: 'A sanctuary and natural habitat of the Balinese long-tailed macaque, located in the cool highlands of Ubud.',
        about: 'Sacred Monkey Forest Sanctuary dedicated to conservation and spiritual devotion according to Tri Hita Karana.',
        operational_hours: '09:00 AM - 06:00 PM',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        facilities: ['Visitor Center', 'Restrooms', 'Information Desk', 'Free Parking']
      },
      {
        slug: 'nusa-penida',
        destSlug: 'bali',
        name: 'Nusa Penida Kelingking Beach',
        location_label: 'Nusa Penida, Bali',
        description: 'A famous cliff formation resembling a T-Rex overlooking a crystal clear turquoise bay and pristine white sand.',
        about: 'Secluded island preserving dramatic limestone cliffs, manta ray sanctuaries, and untouched beaches.',
        operational_hours: '24 Hours (Best in Daylight)',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        facilities: ['Local warungs', 'Restrooms', 'Ferry Harbor Access', 'Viewing Deck']
      },
      {
        slug: 'kota-tua',
        destSlug: 'jakarta',
        name: 'Old Batavia (Kota Tua)',
        location_label: 'West Jakarta',
        description: 'The historic core of Jakarta, boasting 17th-century Dutch colonial buildings centered around Fatahillah Square.',
        about: 'Former VOC headquarters established in 1619, featuring vintage bicycle rides and historic cafes.',
        operational_hours: '24 Hours (Museums close at 03:00 PM)',
        image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
        facilities: ['Bicycle Rental', 'Jakarta History Museum', 'Cafe Batavia', 'Train Station']
      },
      {
        slug: 'taman-mini',
        destSlug: 'jakarta',
        name: 'Taman Mini Indonesia Indah',
        location_label: 'East Jakarta',
        description: 'A culture-based recreational area showcasing pavilions representing the traditional homes of all 38 Indonesian provinces.',
        about: 'Cultural park opened in 1975 to foster national unity, featuring cable cars and archipelago lakes.',
        operational_hours: '06:00 AM - 08:00 PM',
        image: 'https://images.unsplash.com/photo-1620127252536-03bdfcf6d5c3?auto=format&fit=crop&w=800&q=80',
        facilities: ['Cable Car', 'Museums', 'Traditional Houses', 'Bicycle Tracks']
      },
      {
        slug: 'borobudur',
        destSlug: 'yogyakarta',
        name: 'Borobudur Temple',
        location_label: 'Magelang (near Yogyakarta)',
        description: 'The world largest Buddhist temple, a UNESCO World Heritage Site featuring 9 stacked platforms and 72 open-work stupas.',
        about: '9th-century Sailendra dynasty monument adorned with 2,672 relief panels and 504 Buddha statues.',
        operational_hours: '06:30 AM - 04:30 PM',
        image: 'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=800&q=80',
        facilities: ['Visitor Center', 'Audioguides', 'Shuttle Trains', 'Souvenir Stalls', 'Museums']
      },
      {
        slug: 'prambanan',
        destSlug: 'yogyakarta',
        name: 'Prambanan Temple',
        location_label: 'Sleman, Yogyakarta',
        description: 'A magnificent 10th-century Hindu temple compound dedicated to the Trimurti (Brahma, Vishnu, and Shiva).',
        about: 'Tallest Hindu temple in Indonesia representing Mount Meru, home to the Ramayana Ballet open-air stage.',
        operational_hours: '06:30 AM - 05:00 PM',
        image: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=800&q=80',
        facilities: ['Ramayana Ballet Stage', 'Souvenir Center', 'Park Area', 'Information Center']
      },
      {
        slug: 'tangkoeban-perahoe',
        destSlug: 'bandung',
        name: 'Tangkuban Perahu Volcano',
        location_label: 'Lembang, West Java',
        description: 'An active volcano north of Bandung, offering crater treks and geothermal hot springs to boil eggs in sulfur pools.',
        about: 'Famous inverted-boat volcano tied to the legend of Sangkuriang, surrounded by tea estates.',
        operational_hours: '08:00 AM - 05:00 PM',
        image: 'https://images.unsplash.com/photo-1579294819770-5b1285074b62?auto=format&fit=crop&w=800&q=80',
        facilities: ['Crater Walkway', 'Local Stalls', 'Volcano Guides', 'Parking Lot']
      },
      {
        slug: 'gili-islands',
        destSlug: 'lombok',
        name: 'The Gili Islands',
        location_label: 'North Lombok Regency',
        description: 'Three small islands—Gili Trawangan, Gili Meno, and Gili Air—known for sandy beaches, coral reefs, and sea turtles.',
        about: 'Motor-free tropical islands featuring underwater sculpture gardens and sea turtle preservation.',
        operational_hours: '24 Hours',
        image: 'https://images.unsplash.com/photo-1530948990335-1eb93cbe6430?auto=format&fit=crop&w=800&q=80',
        facilities: ['Bicycle Rental', 'Diving Schools', 'Beachfront Resorts', 'Boat Charters']
      },
      {
        slug: 'padar-island',
        destSlug: 'labuan-bajo',
        name: 'Padar Island Viewpoint',
        location_label: 'Komodo National Park, Flores',
        description: 'A legendary viewpoint on Padar Island displaying three distinct crescent bays of white, pink, and black sand beaches.',
        about: 'Dramatic rugged volcanic island offering Southeast Asia’s most iconic sunrise viewpoint.',
        operational_hours: '06:00 AM - 05:00 PM',
        image: 'https://images.unsplash.com/photo-1530948990335-1eb93cbe6430?auto=format&fit=crop&w=800&q=80',
        facilities: ['Wooden Steps', 'Ferry jetty', 'Small Ranger Post', 'Security guards']
      }
    ];

    const attrMap = new Map<string, string>(); // slug -> UUID

    for (const a of attractions) {
      const destId = destMap.get(a.destSlug);
      const res = await pool.query(
        `INSERT INTO content.attractions (
           destination_id, name, slug, location_label, description, about,
           operational_hours, facilities, image, status, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published', NOW())
         ON CONFLICT (slug) DO UPDATE
         SET destination_id = EXCLUDED.destination_id,
             name = EXCLUDED.name,
             location_label = EXCLUDED.location_label,
             description = EXCLUDED.description,
             about = EXCLUDED.about,
             operational_hours = EXCLUDED.operational_hours,
             facilities = EXCLUDED.facilities,
             image = EXCLUDED.image,
             updated_at = NOW()
         RETURNING id, slug;`,
        [destId, a.name, a.slug, a.location_label, a.description, a.about, a.operational_hours, a.facilities, a.image]
      );
      attrMap.set(a.slug, res.rows[0].id);
    }
    console.log(`✅ ${attractions.length} Experiences (attractions) seeded.`);

    // ==========================================
    // 8. SEED PROVIDERS (program.providers)
    // ==========================================
    const providers = [
      {
        legal_name: 'PT Bali Samudra Experiential',
        display_name: 'Bali Samudra Outbound & Expeditions',
        contact_info: {
          email: 'partner@balisamudra.co.id',
          phone: '+62 361-789-2041',
          city: 'Badung, Bali',
          aeli_id: 'AELI-PROV-BALI-01',
          bank_name: 'Bank Central Asia (BCA)',
          bank_account: '8830192841'
        }
      },
      {
        legal_name: 'PT Batavia Heritage & Outbound',
        display_name: 'Batavia Heritage Learning Journey',
        contact_info: {
          email: 'support@bataviaheritage.com',
          phone: '+62 21-5290-3344',
          city: 'Jakarta Pusat, DKI Jakarta',
          aeli_id: 'AELI-PROV-JKT-02',
          bank_name: 'Bank Mandiri',
          bank_account: '1220098492019'
        }
      },
      {
        legal_name: 'PT Jogja Kraton Heritage Journey',
        display_name: 'Kraton Mataram Culture & Adventure',
        contact_info: {
          email: 'reservation@jogjakraton.id',
          phone: '+62 274-512-889',
          city: 'Yogyakarta, D.I. Yogyakarta',
          aeli_id: 'AELI-PROV-DIY-03',
          bank_name: 'Bank Central Asia (BCA)',
          bank_account: '0372881944'
        }
      },
      {
        legal_name: 'PT Parahyangan Highland Expeditions',
        display_name: 'Parahyangan Highland Outdoor',
        contact_info: {
          email: 'info@parahyanganoutdoor.co.id',
          phone: '+62 22-8201-9988',
          city: 'Bandung, Jawa Barat',
          aeli_id: 'AELI-PROV-BDG-04',
          bank_name: 'Bank BNI',
          bank_account: '0981298410'
        }
      },
      {
        legal_name: 'PT Mataram Sasak Rinjani Adventure',
        display_name: 'Sasak Rinjani Eco Adventure',
        contact_info: {
          email: 'contact@sasakrinjani.com',
          phone: '+62 370-629-102',
          city: 'Lombok Barat, NTB',
          aeli_id: 'AELI-PROV-LMB-05',
          bank_name: 'Bank BRI',
          bank_account: '472901928401928'
        }
      },
      {
        legal_name: 'PT Komodo Flores Wild Discovery',
        display_name: 'Komodo Flores Marine Expedition',
        contact_info: {
          email: 'booking@komodoflores.com',
          phone: '+62 385-412-890',
          city: 'Labuan Bajo, NTT',
          aeli_id: 'AELI-PROV-LBJ-06',
          bank_name: 'Bank Central Asia (BCA)',
          bank_account: '8910293812'
        }
      },
      {
        legal_name: 'PT Majapahit Heroes Outbound',
        display_name: 'Majapahit Heroes Experiential Center',
        contact_info: {
          email: 'ops@majapahitoutbound.id',
          phone: '+62 31-892-4411',
          city: 'Surabaya, Jawa Timur',
          aeli_id: 'AELI-PROV-SBY-07',
          bank_name: 'Bank Mandiri',
          bank_account: '1410098234123'
        }
      }
    ];

    const provMap = new Map<string, string>(); // legal_name -> UUID

    for (const p of providers) {
      const res = await pool.query(
        `INSERT INTO program.providers (legal_name, display_name, contact_info, status, updated_at)
         VALUES ($1, $2, $3, 'active', NOW())
         ON CONFLICT (legal_name) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             contact_info = EXCLUDED.contact_info,
             updated_at = NOW()
         RETURNING id, legal_name;`,
        [p.legal_name, p.display_name, JSON.stringify(p.contact_info)]
      );
      provMap.set(p.legal_name, res.rows[0].id);
    }
    console.log(`✅ ${providers.length} AELI Tour & Experiential Providers seeded.`);

    // ==========================================
    // 9. SEED CATEGORIES (program.categories)
    // ==========================================
    const categories = [
      {
        name: 'Cultural Immersion',
        description: 'Deep engagement with local customs, traditional crafts, heritage performing arts, and royal palace historical explorations.',
        color: 'from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-500/20 bg-purple-500/5',
        gradient: 'from-purple-500 to-indigo-600'
      },
      {
        name: 'Adventure & Challenge',
        description: 'High-energy outdoor exploration including mountain trekking, coastal island snorkeling, and 4x4 safaris.',
        color: 'from-orange-500/10 to-red-500/10 text-orange-600 border-orange-500/20 bg-orange-500/5',
        gradient: 'from-orange-500 to-red-600'
      },
      {
        name: 'Nature & Eco Experience',
        description: 'Eco-tourism initiatives emphasizing pristine environments, volcanic lakes, wildlife sanctuaries, and sustainable farming.',
        color: 'from-green-500/10 to-emerald-500/10 text-green-600 border-green-500/20 bg-green-500/5',
        gradient: 'from-green-500 to-emerald-600'
      },
      {
        name: 'Community & Social Impact',
        description: 'Experiential learning combined with village capacity building, craft apprenticeships, and cultural exchange.',
        color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20 bg-emerald-500/5',
        gradient: 'from-emerald-500 to-teal-600'
      },
      {
        name: 'Culinary Journey',
        description: 'Exploration of authentic regional gastronomy, street food tasting, organic spice harvesting, and cooking masterclasses.',
        color: 'from-yellow-500/10 to-amber-500/10 text-amber-700 border-amber-500/20 bg-amber-500/5',
        gradient: 'from-yellow-500 to-amber-600'
      }
    ];

    for (const c of categories) {
      await pool.query(
        `INSERT INTO program.categories (name, description, color, gradient)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO UPDATE
         SET description = EXCLUDED.description, color = EXCLUDED.color, gradient = EXCLUDED.gradient;`,
        [c.name, c.description, c.color, c.gradient]
      );
    }
    console.log(`✅ ${categories.length} Program Categories verified.`);

    // ==========================================
    // 10. SEED 10 PROGRAMS (Linked to Provider, Destination, & Experience)
    // ==========================================
    const tenPrograms = [
      {
        name: 'Tanah Lot Sunset & Cultural Temple Program',
        providerName: 'PT Bali Samudra Experiential',
        destSlug: 'bali',
        attrSlug: 'tanah-lot',
        category: 'Cultural Immersion',
        location_label: 'Tabanan, Bali',
        short_description: 'Witness the iconic sea temple Tanah Lot at golden hour, learn Balinese mythologies, and experience traditional cleansing rituals.',
        overview: 'A deeply restorative cultural exploration into Balinese Hindu sea mythology, royal architecture, and breathtaking sunset panoramas.',
        highlights: ['Private hotel pickup', 'Skip-the-line entrance tickets', 'Expert Balinese historian guide', 'Sunset photo spots'],
        price_min: 735000,
        price_max: 950000,
        price_unit: 'person',
        price_note: 'Includes sarong rental, private SUV, and donation to temple preservation',
        duration_label: '6 Hours',
        min_quota: 2,
        max_quota: 15,
        meeting_point: 'Hotel Lobby pickup (Kuta/Seminyak/Ubud/Nusa Dua)',
        rating: 4.8,
        reviews_count: 312,
        image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Taman Ayun Royal Temple', feature: 'Royal family moat and multi-tiered shrines', challenge: 'Observe traditional Balinese carving iconography' },
          { order: 2, location: 'Tanah Lot Ocean Cliffs', feature: 'High sea tide panoramic view', challenge: 'Receive coastal holy water purification ritual' }
        ],
        rundowns: [
          { order: 1, time: '01:30 PM', duration: 90, activity: 'Hotel pick up and scenic rural drive', location: 'Hotel Lobby' },
          { order: 2, time: '03:00 PM', duration: 75, activity: 'Taman Ayun temple walk and architecture briefing', location: 'Mengwi' },
          { order: 3, time: '05:00 PM', duration: 120, activity: 'Tanah Lot ocean cliffs & golden sunset spectacle', location: 'Tanah Lot' }
        ],
        inclusions: ['Air-conditioned transport', 'Entrance fees', 'Local mineral water', 'Sarong rental'],
        exclusions: ['Dinner costs', 'Personal expenses', 'Guide tips']
      },
      {
        name: 'Ubud Art Guild & Sacred Monkey Forest Safari',
        providerName: 'PT Bali Samudra Experiential',
        destSlug: 'bali',
        attrSlug: 'ubud-monkey-forest',
        category: 'Nature & Eco Experience',
        location_label: 'Ubud, Bali',
        short_description: 'Explore Ubud famous woodcarving villages, walk the sacred monkey forest, swing over rice terraces, and visit local craft markets.',
        overview: 'Immerse your group into the artistic soul of Ubud, exploring sustainable forestry, primate biology, and traditional woodcraft.',
        highlights: ['Interact with macaque monkeys', 'Scenic jungle swings', 'Batik and woodcarving workshops', 'Organic plantation lunch'],
        price_min: 585000,
        price_max: 750000,
        price_unit: 'person',
        price_note: 'Includes admission to sanctuary and artisan workshop access',
        duration_label: '8 Hours',
        min_quota: 2,
        max_quota: 20,
        meeting_point: 'Ubud central hotels or Denpasar meeting point',
        rating: 4.7,
        reviews_count: 185,
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Celuk & Mas Artisan Guilds', feature: 'Handmade silver and wood sculpture masters', challenge: 'Learn chisel techniques from local craftsmen' },
          { order: 2, location: 'Sacred Monkey Forest Sanctuary', feature: 'Nutmeg forest canopy with ancient moss temples', challenge: 'Primate behavioral observation' }
        ],
        rundowns: [
          { order: 1, time: '08:30 AM', duration: 60, activity: 'Pickup and transfer to Ubud highlands', location: 'Ubud' },
          { order: 2, time: '10:00 AM', duration: 120, activity: 'Guided Monkey Forest exploration', location: 'Padangtegal' },
          { order: 3, time: '12:30 PM', duration: 90, activity: 'Traditional Balinese organic lunch', location: 'Tegallalang' }
        ],
        inclusions: ['Private SUV Transport', 'All admission tickets', 'Local program driver', 'Traditional Indonesian lunch'],
        exclusions: ['Jungle swing fee (optional)', 'Souvenirs', 'Drinks']
      },
      {
        name: 'Nusa Penida East Coast Snorkeling & Beach Program',
        providerName: 'PT Bali Samudra Experiential',
        destSlug: 'bali',
        attrSlug: 'nusa-penida',
        category: 'Adventure & Challenge',
        location_label: 'Nusa Penida, Bali',
        short_description: 'Fast boat to Nusa Penida island, visit dinosaur-shaped Kelingking Cliff, and snorkel with wild Manta Rays.',
        overview: 'Full-day marine and geological challenge across the rugged limestone islands southeast of Bali.',
        highlights: ['Swim with Manta Rays', 'Fast boat roundtrip tickets', 'T-rex shape Kelingking Beach viewpoint', 'Broken Beach & Angel Billabong'],
        price_min: 1425000,
        price_max: 1800000,
        price_unit: 'person',
        price_note: 'Includes express catamaran tickets and certified marine guide',
        duration_label: '10 Hours',
        min_quota: 2,
        max_quota: 12,
        meeting_point: 'Sanur Harbor Boat Counter',
        rating: 4.9,
        reviews_count: 267,
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Manta Bay Snorkeling', feature: 'Ocean currents with feeding manta rays', challenge: 'Open water snorkeling with marine life' },
          { order: 2, location: 'Kelingking Secret Point', feature: 'Iconic T-Rex shaped cliff ridge', challenge: 'Climb steep limestone stairs safely' }
        ],
        rundowns: [
          { order: 1, time: '07:00 AM', duration: 45, activity: 'Catamaran check-in and harbor departure', location: 'Sanur' },
          { order: 2, time: '08:30 AM', duration: 150, activity: 'Manta Point and Crystal Bay snorkeling', location: 'Nusa Penida' },
          { order: 3, time: '02:00 PM', duration: 120, activity: 'Kelingking ridge photography & exploration', location: 'Kelingking' }
        ],
        inclusions: ['Fast boat ticket', 'Snorkeling equipment', 'Boat captain & guide', 'Indonesian lunch buffet', 'Air-conditioned island car'],
        exclusions: ['Manta Ray conservation contribution', 'Personal souvenirs']
      },
      {
        name: 'Old Batavia Colonial Walking Program',
        providerName: 'PT Batavia Heritage & Outbound',
        destSlug: 'jakarta',
        attrSlug: 'kota-tua',
        category: 'Cultural Immersion',
        location_label: 'West Jakarta',
        short_description: 'Step back in time to 17th-century colonial Batavia. Explore historic plazas, Dutch canals, and vintage bicycle lanes.',
        overview: 'Educational walking tour uncovering VOC maritime history, architecture, and urban transformation in Jakarta.',
        highlights: ['Fatahillah Square history', 'Vintage colonial bicycle ride', 'Dutch canal walks', 'Coffee stop at Cafe Batavia'],
        price_min: 375000,
        price_max: 500000,
        price_unit: 'person',
        price_note: 'Includes museum tickets and vintage Onthel bicycle rental',
        duration_label: '4 Hours',
        min_quota: 4,
        max_quota: 30,
        meeting_point: 'Fatahillah Square fountain',
        rating: 4.6,
        reviews_count: 89,
        image: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1596402184320-417e7178b2cd?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Fatahillah Square & City Hall', feature: '1710 Dutch administrative court', challenge: 'Decipher VOC historical inscriptions' },
          { order: 2, location: 'Sunda Kelapa Harbor', feature: 'Traditional wooden Pinisi schooners', challenge: 'Document maritime cargo loading heritage' }
        ],
        rundowns: [
          { order: 1, time: '08:30 AM', duration: 60, activity: 'History briefing and Jakarta History Museum', location: 'Fatahillah' },
          { order: 2, time: '10:00 AM', duration: 60, activity: 'Onthel bicycle ride to Sunda Kelapa harbor', location: 'Sunda Kelapa' },
          { order: 3, time: '11:30 AM', duration: 60, activity: 'Discussion at Cafe Batavia', location: 'Cafe Batavia' }
        ],
        inclusions: ['Local historian guide', 'Museum entrance fees', 'Bicycle & helmet rental', 'Traditional snack platter'],
        exclusions: ['Lunch', 'Tips']
      },
      {
        name: 'Taman Mini Indonesia Cultural Heritage Program',
        providerName: 'PT Batavia Heritage & Outbound',
        destSlug: 'jakarta',
        attrSlug: 'taman-mini',
        category: 'Cultural Immersion',
        location_label: 'East Jakarta',
        short_description: 'Experience all of Indonesia in one day. Visit traditional houses of various provinces and ride cable cars over miniature archipelago.',
        overview: 'A comprehensive national identity and ethnic architecture tour designed for student groups, delegations, and heritage travelers.',
        highlights: ['Explore 38 provincial pavilions', 'Ride cable car over miniature Indonesia', 'Museum of Indonesia tickets', 'Sundanese lunch'],
        price_min: 675000,
        price_max: 850000,
        price_unit: 'person',
        price_note: 'Includes entry tickets, cable car, and pavilion guide permits',
        duration_label: '7 Hours',
        min_quota: 5,
        max_quota: 50,
        meeting_point: 'Hotel Lobby (Jakarta areas)',
        rating: 4.7,
        reviews_count: 104,
        image: 'https://images.unsplash.com/photo-1620127252536-03bdfcf6d5c3?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1620127252536-03bdfcf6d5c3?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Sumatra & Papua Pavilions', feature: 'Traditional Rumah Gadang and Honai structures', challenge: 'Identify architectural earthquake-resistant joinery' },
          { order: 2, location: 'Archipelago Miniature Lake', feature: 'Aerial cable car viewing deck', challenge: 'Map archipelago island distribution from above' }
        ],
        rundowns: [
          { order: 1, time: '08:30 AM', duration: 60, activity: 'Departure to TMII complex', location: 'Jakarta' },
          { order: 2, time: '09:45 AM', duration: 120, activity: 'Provincial pavilion walking seminar', location: 'TMII' },
          { order: 3, time: '01:00 PM', duration: 90, activity: 'Sundanese lunch & Museum of Indonesia', location: 'Lakeside' }
        ],
        inclusions: ['Private vehicle transit', 'Entry tickets & cable car ticket', 'Provincial guide explanation', 'Indonesian lunch'],
        exclusions: ['Additional museum tickets (optional)']
      },
      {
        name: 'Borobudur Sunrise & Village Cycling Program',
        providerName: 'PT Jogja Kraton Heritage Journey',
        destSlug: 'yogyakarta',
        attrSlug: 'borobudur',
        category: 'Cultural Immersion',
        location_label: 'Magelang, Central Java',
        short_description: 'Witness sunrise over Borobudur from Punthuk Setumbu hill, explore the temple structure, and cycle through rustic rice villages.',
        overview: 'Dawn awakening program combining Buddhist philosophical reliefs, dawn mist panoramas, and rural community interaction.',
        highlights: ['Breathtaking sunrise viewpoint', 'Guided climb of Borobudur temple', 'Bicycle ride through local Javanese villages', 'Traditional Javanese breakfast'],
        price_min: 1275000,
        price_max: 1600000,
        price_unit: 'person',
        price_note: 'Includes morning sunrise access, cycle rental, and local artisan village donation',
        duration_label: '9 Hours',
        min_quota: 2,
        max_quota: 25,
        meeting_point: 'Hotel lobby (Yogyakarta city center) at 03:30 AM',
        rating: 5.0,
        reviews_count: 567,
        image: 'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1584810359583-96fc3448beaa?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Punthuk Setumbu Ridge', feature: 'Sunrise behind Mount Merapi illuminating temple stupas', challenge: 'Capture the golden hour mist photography' },
          { order: 2, location: 'Borobudur Stupa Monument', feature: 'Lalitavistara relief narrative', challenge: 'Decode Buddhist mindfulness principles' }
        ],
        rundowns: [
          { order: 1, time: '03:30 AM', duration: 75, activity: 'Pre-dawn transit to Magelang hills', location: 'Yogyakarta' },
          { order: 2, time: '05:00 AM', duration: 90, activity: 'Punthuk Setumbu sunrise contemplation', location: 'Punthuk Setumbu' },
          { order: 3, time: '07:30 AM', duration: 120, activity: 'Borobudur temple monumental walk', location: 'Borobudur' }
        ],
        inclusions: ['AC minivan transfers', 'All entry tickets', 'Javanese bicycle rental', 'Guided temple program', 'Buffet breakfast'],
        exclusions: ['Climb-up temple special ticket supplement', 'Personal tips']
      },
      {
        name: 'Prambanan Hindu Temple & Ramayana Ballet Show',
        providerName: 'PT Jogja Kraton Heritage Journey',
        destSlug: 'yogyakarta',
        attrSlug: 'prambanan',
        category: 'Cultural Immersion',
        location_label: 'Sleman, Yogyakarta',
        short_description: 'Explore the high towers of Prambanan at sunset, followed by a buffet dinner and the legendary Ramayana dance performance.',
        overview: 'An unforgettable evening of Javanese royal mythology, open-air theater, and dramatic temple illumination.',
        highlights: ['Explore Prambanan temple compound', 'Sunset photos of stone spires', 'Premium seats for Ramayana Ballet', 'Open-air buffet dinner'],
        price_min: 1035000,
        price_max: 1350000,
        price_unit: 'person',
        price_note: 'Includes VIP open-air theater seats and garden dinner',
        duration_label: '8 Hours',
        min_quota: 2,
        max_quota: 20,
        meeting_point: 'Yogyakarta hotels',
        rating: 4.9,
        reviews_count: 294,
        image: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1604999333679-b86d54738315?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Shiva & Brahma Spires', feature: '47-meter tall Shiva Mahadeva temple', challenge: 'Inspect sculpted Ramayana friezes' },
          { order: 2, location: 'Ramayana Open Air Theater', feature: 'Live gamelan orchestra with 200 dancers', challenge: 'Follow Prince Rama heroic narrative' }
        ],
        rundowns: [
          { order: 1, time: '02:00 PM', duration: 60, activity: 'Transit to eastern Prambanan plains', location: 'Yogyakarta' },
          { order: 2, time: '03:30 PM', duration: 120, activity: 'Candi Sewu and Prambanan temple walkthrough', location: 'Prambanan' },
          { order: 3, time: '07:30 PM', duration: 120, activity: 'Ramayana Ballet theatrical performance', location: 'Open Theater' }
        ],
        inclusions: ['Hotel pickups', 'All entry fees', 'VIP theater ticket', 'Javanese buffet dinner'],
        exclusions: ['Personal beverages', 'Guide gratuities']
      },
      {
        name: 'Tangkuban Perahu Volcano & Hot Springs Day Program',
        providerName: 'PT Parahyangan Highland Expeditions',
        destSlug: 'bandung',
        attrSlug: 'tangkoeban-perahoe',
        category: 'Nature & Eco Experience',
        location_label: 'Lembang, West Java',
        short_description: 'Peer into the giant smoking crater of Tangkuban Perahu, bathe in Ciater sulfurous hot springs, and visit civet coffee plantations.',
        overview: 'Volcanology and geothermal healing expedition set within misty mountain tea plantations.',
        highlights: ['Walk Tangkuban Perahu crater edge', 'Bathe in Ciater volcanic mineral pools', 'Civet coffee Luwak tasting session', 'Visit strawberry farms'],
        price_min: 825000,
        price_max: 1050000,
        price_unit: 'person',
        price_note: 'Includes thermal pool admission and authentic Sundanese lunch',
        duration_label: '8 Hours',
        min_quota: 2,
        max_quota: 25,
        meeting_point: 'Bandung central hotels',
        rating: 4.5,
        reviews_count: 198,
        image: 'https://images.unsplash.com/photo-1579294819770-5b1285074b62?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1579294819770-5b1285074b62?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Kawah Ratu Volcanic Rim', feature: 'Smoking fumaroles and sulfur crusts', challenge: 'Crater geology field observation' },
          { order: 2, location: 'Ciater Geothermal Springs', feature: 'Natural mineral thermal stream', challenge: 'Therapeutic foot relaxation bath' }
        ],
        rundowns: [
          { order: 1, time: '08:00 AM', duration: 90, activity: 'Ascent to Lembang mountain plateau', location: 'Bandung' },
          { order: 2, time: '10:00 AM', duration: 120, activity: 'Kawah Ratu rim hike and vapor inspection', location: 'Tangkuban Perahu' },
          { order: 3, time: '01:00 PM', duration: 90, activity: 'Ciater thermal pool soak & Sundanese lunch', location: 'Ciater' }
        ],
        inclusions: ['Minivan transport', 'All park admissions & hot spring entry', 'Local guide driver', 'Sundanese lunch platter'],
        exclusions: ['Volcano guide tip', 'Personal shopping']
      },
      {
        name: 'Gili Islands 3-Island Private Snorkeling Boat Program',
        providerName: 'PT Mataram Sasak Rinjani Adventure',
        destSlug: 'lombok',
        attrSlug: 'gili-islands',
        category: 'Adventure & Challenge',
        location_label: 'North Lombok',
        short_description: 'Board a private glass-bottom boat to snorkel Gili Islands. Visit underwater human statues at Gili Meno and swim with wild turtles.',
        overview: 'Pristine marine eco-adventure exploring coral reef restoration, green sea turtle habitats, and white-sand lagoons.',
        highlights: ['Private glass-bottom boat', 'Snorkel Gili Meno underwater statues', 'Swim with green sea turtles', 'Beach exploration at Gili Air'],
        price_min: 975000,
        price_max: 1250000,
        price_unit: 'person',
        price_note: 'Includes private charter boat, GoPro files, and full snorkeling gear',
        duration_label: '8 Hours',
        min_quota: 2,
        max_quota: 10,
        meeting_point: 'Teluk Nare Harbor / Senggigi hotel lobby',
        rating: 4.9,
        reviews_count: 312,
        image: 'https://images.unsplash.com/photo-1530948990335-1eb93cbe6430?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1530948990335-1eb93cbe6430?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'The Nest Underwater Statues (Gili Meno)', feature: 'Jason deCaires Taylor circular sculpture', challenge: 'Freediving photo challenge at 4m depth' },
          { order: 2, location: 'Turtle Point Reef (Gili Trawangan)', feature: 'Wild green and hawksbill sea turtles', challenge: 'Non-invasive marine observation' }
        ],
        rundowns: [
          { order: 1, time: '08:30 AM', duration: 30, activity: 'Private boat departure from Teluk Nare', location: 'Teluk Nare' },
          { order: 2, time: '09:30 AM', duration: 120, activity: 'Snorkeling statues & turtle sanctuaries', location: 'Gili Meno' },
          { order: 3, time: '01:00 PM', duration: 90, activity: 'Beachside seafood lunch at Gili Air', location: 'Gili Air' }
        ],
        inclusions: ['Private boat charter', 'All snorkeling gear & life jackets', 'Underwater GoPro photo files', 'Pickups from Lombok mainland', 'Local boat captain & guide'],
        exclusions: ['Lunch expenses at Gili beach restaurant']
      },
      {
        name: 'Komodo Dragons Expeditions & Padar Island Sunrise',
        providerName: 'PT Komodo Flores Wild Discovery',
        destSlug: 'labuan-bajo',
        attrSlug: 'padar-island',
        category: 'Adventure & Challenge',
        location_label: 'Labuan Bajo, Flores',
        short_description: 'Speedboat voyage across Komodo National Park. Climb Padar Island at dawn, track giant Komodo dragons, and relax on Pink Beach.',
        overview: 'Premier expedition into the ancient realm of the Komodo Dragon, multi-colored volcanic sand bays, and coral archipelagos.',
        highlights: ['Climb Padar Island sunrise summit', 'Track wild Komodo Dragons with rangers', 'Snorkel pristine coral gardens at Pink Beach', 'Premium express speedboat'],
        price_min: 2850000,
        price_max: 3500000,
        price_unit: 'person',
        price_note: 'Includes VIP speedboat charter, ranger permits, and gourmet breakfast box',
        duration_label: '12 Hours',
        min_quota: 2,
        max_quota: 18,
        meeting_point: 'Labuan Bajo Harbor Marina Pier',
        rating: 5.0,
        reviews_count: 428,
        image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
        gallery: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80'],
        itineraries: [
          { order: 1, location: 'Padar Island Summit Ridge', feature: '3-bay panorama with white, pink, and black sand', challenge: 'Ascend 815 wooden steps before dawn' },
          { order: 2, location: 'Komodo Dragon Savanna Trail', feature: 'Varanus komodoensis apex predator tracking', challenge: 'Adhere to ranger safety protocols in wildlife zones' }
        ],
        rundowns: [
          { order: 1, time: '05:00 AM', duration: 75, activity: 'Speedboat departure under starlight to Padar', location: 'Labuan Bajo' },
          { order: 2, time: '06:30 AM', duration: 120, activity: 'Sunrise summit hike at Padar Island', location: 'Padar Island' },
          { order: 3, time: '09:30 AM', duration: 120, activity: 'Komodo dragon tracking with national park rangers', location: 'Komodo Island' },
          { order: 4, time: '01:00 PM', duration: 90, activity: 'Pink Beach coral snorkeling and lunch box', location: 'Pink Beach' }
        ],
        inclusions: ['Speedboat charter', 'National park ranger fees', 'Snorkeling equipment', 'Gourmet lunch box', 'Harbor transfers'],
        exclusions: ['National park entrance cash levy', 'Personal tips']
      }
    ];

    // Clear existing programs and re-insert fresh
    await pool.query('DELETE FROM program.itinerary_stops;');
    await pool.query('DELETE FROM program.rundown_items;');
    await pool.query('DELETE FROM program.include_exclude_items;');
    await pool.query('DELETE FROM program.programs;');

    for (const p of tenPrograms) {
      const provId = provMap.get(p.providerName);
      const destId = destMap.get(p.destSlug);
      const attrId = attrMap.get(p.attrSlug);

      const progRes = await pool.query(
        `INSERT INTO program.programs (
           provider_id, destination_id, attraction_id, name, category,
           location_label, short_description, overview, highlights,
           price_min, price_max, price_unit, price_note, duration_label,
           min_quota, max_quota, max_guest_min, max_guest_max, meeting_point,
           rating, reviews_count, image, gallery, status, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, 'published', NOW())
         RETURNING id;`,
        [
          provId, destId, attrId, p.name, p.category,
          p.location_label, p.short_description, p.overview, p.highlights,
          p.price_min, p.price_max, p.price_unit, p.price_note, p.duration_label,
          p.min_quota, p.max_quota, p.min_quota, p.max_quota, p.meeting_point,
          p.rating, p.reviews_count, p.image, p.gallery
        ]
      );
      const programId = progRes.rows[0].id;

      // Seed Itinerary Stops
      for (const it of p.itineraries) {
        await pool.query(
          `INSERT INTO program.itinerary_stops (program_id, order_index, location_name, unique_feature, activity_challenge)
           VALUES ($1, $2, $3, $4, $5);`,
          [programId, it.order, it.location, it.feature, it.challenge]
        );
      }

      // Seed Rundown Items
      for (const rd of p.rundowns) {
        await pool.query(
          `INSERT INTO program.rundown_items (program_id, order_index, time_label, duration_minutes, session_activity, location)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [programId, rd.order, rd.time, rd.duration, rd.activity, rd.location]
        );
      }

      // Seed Inclusions & Exclusions
      for (const inc of p.inclusions) {
        await pool.query(
          `INSERT INTO program.include_exclude_items (program_id, type, description)
           VALUES ($1, 'include', $2);`,
          [programId, inc]
        );
      }
      for (const exc of p.exclusions) {
        await pool.query(
          `INSERT INTO program.include_exclude_items (program_id, type, description)
           VALUES ($1, 'exclude', $2);`,
          [programId, exc]
        );
      }
    }
    console.log(`✅ 10 Programs seeded with their respective Providers, Locations, Experiences, Itineraries, and Rundowns.`);

    // ==========================================
    // 11. SEED WEB REGISTRATIONS (Live Web Transactions)
    // ==========================================
    await pool.query('DELETE FROM identity.web_registrations;');

    const webTransactions = [
      {
        booking_code: 'AELI-9021-INDO',
        customer_name: 'Michael Tan',
        customer_email: 'm.tan@gmail.com',
        customer_phone: '+62 812-9842-1029',
        program_name: 'Komodo Dragons Expeditions & Padar Island Sunrise',
        experience_name: 'Padar Island Viewpoint',
        location_name: 'Labuan Bajo',
        pax: 4,
        gross_amount: 11400000.00,
        payment_method: 'BCA Virtual Account',
        billing_status: 'Paid',
        joined_interval: '2 hours'
      },
      {
        booking_code: 'AELI-9018-INDO',
        customer_name: 'Sarah Jenkins',
        customer_email: 'sarah.j@traveler.com',
        customer_phone: '+1 415-892-3301',
        program_name: 'Nusa Penida East Coast Snorkeling & Beach Program',
        experience_name: 'Nusa Penida Kelingking Beach',
        location_name: 'Bali',
        pax: 2,
        gross_amount: 2850000.00,
        payment_method: 'Credit Card (Visa)',
        billing_status: 'Paid',
        joined_interval: '6 hours'
      },
      {
        booking_code: 'AELI-9014-INDO',
        customer_name: 'Budi Santoso',
        customer_email: 'budi.s@outlook.com',
        customer_phone: '+62 813-4412-8876',
        program_name: 'Borobudur Sunrise & Village Cycling Program',
        experience_name: 'Borobudur Temple',
        location_name: 'Yogyakarta',
        pax: 5,
        gross_amount: 6375000.00,
        payment_method: 'Mandiri VA',
        billing_status: 'Pending',
        joined_interval: '1 day'
      },
      {
        booking_code: 'AELI-9009-INDO',
        customer_name: 'Siti Rahmawati',
        customer_email: 'siti.rahma@perusahaan.co.id',
        customer_phone: '+62 811-9201-4455',
        program_name: 'Tanah Lot Sunset & Cultural Temple Program',
        experience_name: 'Tanah Lot Temple',
        location_name: 'Bali',
        pax: 8,
        gross_amount: 5880000.00,
        payment_method: 'BCA Virtual Account',
        billing_status: 'Paid',
        joined_interval: '2 days'
      },
      {
        booking_code: 'AELI-8994-INDO',
        customer_name: 'David Lee',
        customer_email: 'david.lee@bluepeak.app',
        customer_phone: '+62 811-2093-4819',
        program_name: 'Prambanan Hindu Temple & Ramayana Ballet Show',
        experience_name: 'Prambanan Temple',
        location_name: 'Yogyakarta',
        pax: 4,
        gross_amount: 4140000.00,
        payment_method: 'BCA Virtual Account',
        billing_status: 'Paid',
        joined_interval: '3 days'
      },
      {
        booking_code: 'AELI-8982-INDO',
        customer_name: 'Linda Chen',
        customer_email: 'linda.chen@brightpath.app',
        customer_phone: '+65 9182-4019',
        program_name: 'Gili Islands 3-Island Private Snorkeling Boat Program',
        experience_name: 'The Gili Islands',
        location_name: 'Lombok',
        pax: 3,
        gross_amount: 2925000.00,
        payment_method: 'QRIS Digital Wallet',
        billing_status: 'Paid',
        joined_interval: '4 days'
      },
      {
        booking_code: 'AELI-8975-INDO',
        customer_name: 'Kevin Harris',
        customer_email: 'kevin.harris@oakline.co',
        customer_phone: '+1 206-891-2039',
        program_name: 'Tangkuban Perahu Volcano & Hot Springs Day Program',
        experience_name: 'Tangkuban Perahu Volcano',
        location_name: 'Bandung',
        pax: 2,
        gross_amount: 1650000.00,
        payment_method: 'Credit Card (Visa)',
        billing_status: 'Paid',
        joined_interval: '5 days'
      },
      {
        booking_code: 'AELI-8960-INDO',
        customer_name: 'Jessica Wong',
        customer_email: 'jessica.wong@pulselabs.ai',
        customer_phone: '+852 9482-1920',
        program_name: 'Ubud Art Guild & Sacred Monkey Forest Safari',
        experience_name: 'Ubud Monkey Forest',
        location_name: 'Bali',
        pax: 4,
        gross_amount: 2340000.00,
        payment_method: 'Mandiri VA',
        billing_status: 'Pending',
        joined_interval: '6 days'
      },
      {
        booking_code: 'AELI-8951-INDO',
        customer_name: 'Emily White',
        customer_email: 'emily.white@ridgefield.io',
        customer_phone: '+61 412-902-831',
        program_name: 'Taman Mini Indonesia Cultural Heritage Program',
        experience_name: 'Taman Mini Indonesia Indah',
        location_name: 'Jakarta',
        pax: 6,
        gross_amount: 4050000.00,
        payment_method: 'BCA Virtual Account',
        billing_status: 'Paid',
        joined_interval: '7 days'
      },
      {
        booking_code: 'AELI-8940-INDO',
        customer_name: 'Rian Pratama',
        customer_email: 'rian.pratama@indomail.id',
        customer_phone: '+62 856-7819-2049',
        program_name: 'Old Batavia Colonial Walking Program',
        experience_name: 'Old Batavia (Kota Tua)',
        location_name: 'Jakarta',
        pax: 10,
        gross_amount: 3750000.00,
        payment_method: 'BRI Virtual Account',
        billing_status: 'Paid',
        joined_interval: '8 days'
      }
    ];

    for (const trx of webTransactions) {
      await pool.query(
        `INSERT INTO identity.web_registrations (
           booking_code, customer_name, customer_email, customer_phone,
           program_name, experience_name, location_name, pax, gross_amount,
           payment_method, billing_status, joined
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() - INTERVAL '${trx.joined_interval}');`,
        [
          trx.booking_code, trx.customer_name, trx.customer_email, trx.customer_phone,
          trx.program_name, trx.experience_name, trx.location_name, trx.pax, trx.gross_amount,
          trx.payment_method, trx.billing_status
        ]
      );
    }
    console.log(`✅ 10 Web Registration Transactions seeded.`);

    // ==========================================
    // 12. SEED PAYOUT PROFILE & PROVIDER REVENUE BREAKDOWN
    // ==========================================
    const defaultBankAccounts = [
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
        account_number: '1220098492019',
        account_holder: 'PT INDEX AELI INDONESIA',
        branch: 'KC Sudirman Jakarta',
        is_primary: false,
        verified: true
      }
    ];

    // Map the 10 web transactions into recent purchases with provider and location info
    const recentPurchases = [
      {
        id: 'TRX-BK-9021',
        booking_code: 'AELI-9021-INDO',
        program_name: 'Komodo Dragons Expeditions & Padar Island Sunrise',
        experience_name: 'Padar Island Viewpoint',
        location_name: 'Labuan Bajo',
        provider_name: 'PT Komodo Flores Wild Discovery',
        customer_name: 'Michael Tan',
        customer_email: 'm.tan@gmail.com',
        customer_phone: '+62 812-9842-1029',
        pax: 4,
        gross_amount: 11400000,
        platform_fee: 570000,
        net_payout: 10830000,
        payment_method: 'BCA Virtual Account',
        date: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        status: 'cleared'
      },
      {
        id: 'TRX-BK-9018',
        booking_code: 'AELI-9018-INDO',
        program_name: 'Nusa Penida East Coast Snorkeling & Beach Program',
        experience_name: 'Nusa Penida Kelingking Beach',
        location_name: 'Bali',
        provider_name: 'PT Bali Samudra Experiential',
        customer_name: 'Sarah Jenkins',
        customer_email: 'sarah.j@traveler.com',
        customer_phone: '+1 415-892-3301',
        pax: 2,
        gross_amount: 2850000,
        platform_fee: 142500,
        net_payout: 2707500,
        payment_method: 'Credit Card (Visa)',
        date: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
        status: 'cleared'
      },
      {
        id: 'TRX-BK-9014',
        booking_code: 'AELI-9014-INDO',
        program_name: 'Borobudur Sunrise & Village Cycling Program',
        experience_name: 'Borobudur Temple',
        location_name: 'Yogyakarta',
        provider_name: 'PT Jogja Kraton Heritage Journey',
        customer_name: 'Budi Santoso',
        customer_email: 'budi.s@outlook.com',
        customer_phone: '+62 813-4412-8876',
        pax: 5,
        gross_amount: 6375000,
        platform_fee: 318750,
        net_payout: 6056250,
        payment_method: 'Mandiri VA',
        date: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        status: 'pending_clearance'
      },
      {
        id: 'TRX-BK-9009',
        booking_code: 'AELI-9009-INDO',
        program_name: 'Tanah Lot Sunset & Cultural Temple Program',
        experience_name: 'Tanah Lot Temple',
        location_name: 'Bali',
        provider_name: 'PT Bali Samudra Experiential',
        customer_name: 'Siti Rahmawati',
        customer_email: 'siti.rahma@perusahaan.co.id',
        customer_phone: '+62 811-9201-4455',
        pax: 8,
        gross_amount: 5880000,
        platform_fee: 294000,
        net_payout: 5586000,
        payment_method: 'BCA Virtual Account',
        date: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
        status: 'cleared'
      },
      {
        id: 'TRX-BK-8994',
        booking_code: 'AELI-8994-INDO',
        program_name: 'Prambanan Hindu Temple & Ramayana Ballet Show',
        experience_name: 'Prambanan Temple',
        location_name: 'Yogyakarta',
        provider_name: 'PT Jogja Kraton Heritage Journey',
        customer_name: 'David Lee',
        customer_email: 'david.lee@bluepeak.app',
        customer_phone: '+62 811-2093-4819',
        pax: 4,
        gross_amount: 4140000,
        platform_fee: 207000,
        net_payout: 3933000,
        payment_method: 'BCA Virtual Account',
        date: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
        status: 'cleared'
      },
      {
        id: 'TRX-BK-8982',
        booking_code: 'AELI-8982-INDO',
        program_name: 'Gili Islands 3-Island Private Snorkeling Boat Program',
        experience_name: 'The Gili Islands',
        location_name: 'Lombok',
        provider_name: 'PT Mataram Sasak Rinjani Adventure',
        customer_name: 'Linda Chen',
        customer_email: 'linda.chen@brightpath.app',
        customer_phone: '+65 9182-4019',
        pax: 3,
        gross_amount: 2925000,
        platform_fee: 146250,
        net_payout: 2778750,
        payment_method: 'QRIS Digital Wallet',
        date: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
        status: 'cleared'
      },
      {
        id: 'TRX-BK-8975',
        booking_code: 'AELI-8975-INDO',
        program_name: 'Tangkuban Perahu Volcano & Hot Springs Day Program',
        experience_name: 'Tangkuban Perahu Volcano',
        location_name: 'Bandung',
        provider_name: 'PT Parahyangan Highland Expeditions',
        customer_name: 'Kevin Harris',
        customer_email: 'kevin.harris@oakline.co',
        customer_phone: '+1 206-891-2039',
        pax: 2,
        gross_amount: 1650000,
        platform_fee: 82500,
        net_payout: 1567500,
        payment_method: 'Credit Card (Visa)',
        date: new Date(Date.now() - 3600 * 1000 * 120).toISOString(),
        status: 'cleared'
      },
      {
        id: 'TRX-BK-8960',
        booking_code: 'AELI-8960-INDO',
        program_name: 'Ubud Art Guild & Sacred Monkey Forest Safari',
        experience_name: 'Ubud Monkey Forest',
        location_name: 'Bali',
        provider_name: 'PT Bali Samudra Experiential',
        customer_name: 'Jessica Wong',
        customer_email: 'jessica.wong@pulselabs.ai',
        customer_phone: '+852 9482-1920',
        pax: 4,
        gross_amount: 2340000,
        platform_fee: 117000,
        net_payout: 2223000,
        payment_method: 'Mandiri VA',
        date: new Date(Date.now() - 3600 * 1000 * 144).toISOString(),
        status: 'pending_clearance'
      },
      {
        id: 'TRX-BK-8951',
        booking_code: 'AELI-8951-INDO',
        program_name: 'Taman Mini Indonesia Cultural Heritage Program',
        experience_name: 'Taman Mini Indonesia Indah',
        location_name: 'Jakarta',
        provider_name: 'PT Batavia Heritage & Outbound',
        customer_name: 'Emily White',
        customer_email: 'emily.white@ridgefield.io',
        customer_phone: '+61 412-902-831',
        pax: 6,
        gross_amount: 4050000,
        platform_fee: 202500,
        net_payout: 3847500,
        payment_method: 'BCA Virtual Account',
        date: new Date(Date.now() - 3600 * 1000 * 168).toISOString(),
        status: 'cleared'
      },
      {
        id: 'TRX-BK-8940',
        booking_code: 'AELI-8940-INDO',
        program_name: 'Old Batavia Colonial Walking Program',
        experience_name: 'Old Batavia (Kota Tua)',
        location_name: 'Jakarta',
        provider_name: 'PT Batavia Heritage & Outbound',
        customer_name: 'Rian Pratama',
        customer_email: 'rian.pratama@indomail.id',
        customer_phone: '+62 856-7819-2049',
        pax: 10,
        gross_amount: 3750000,
        platform_fee: 187500,
        net_payout: 3562500,
        payment_method: 'BRI Virtual Account',
        date: new Date(Date.now() - 3600 * 1000 * 192).toISOString(),
        status: 'cleared'
      }
    ];

    const defaultPayoutHistory = [
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
        processed_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
      },
      {
        id: 'PO-2026-1025',
        bank_name: 'Bank Central Asia (BCA)',
        account_number: '8830192841',
        account_holder: 'PT INDEX AELI INDONESIA',
        amount: 28500000,
        transfer_fee: 0,
        reference_code: 'BCA-WD-77192840',
        status: 'completed',
        type: 'automatic',
        processed_at: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString()
      }
    ];

    const clearedTotal = recentPurchases
      .filter((p) => p.status === 'cleared')
      .reduce((sum, p) => sum + p.net_payout, 0);

    const pendingTotal = recentPurchases
      .filter((p) => p.status === 'pending_clearance')
      .reduce((sum, p) => sum + p.net_payout, 0);

    const totalPaidOut = 63500000.00;

    const payoutCheck = await pool.query('SELECT id FROM identity.payout_profiles LIMIT 1;');
    if (payoutCheck.rows.length === 0) {
      await pool.query(
        `INSERT INTO identity.payout_profiles (
           available_balance, pending_balance, total_paid_out,
           auto_payout_enabled, auto_payout_schedule,
           bank_accounts, recent_purchases, payout_history
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
        [
          clearedTotal,
          pendingTotal,
          totalPaidOut,
          true,
          'daily',
          JSON.stringify(defaultBankAccounts),
          JSON.stringify(recentPurchases),
          JSON.stringify(defaultPayoutHistory)
        ]
      );
      console.log('✅ Payout profile seeded with provider-linked purchases and banking records.');
    } else {
      await pool.query(
        `UPDATE identity.payout_profiles
         SET available_balance = $1, pending_balance = $2, total_paid_out = $3,
             bank_accounts = $4, recent_purchases = $5, payout_history = $6, updated_at = NOW()
         WHERE id = $7;`,
        [
          clearedTotal,
          pendingTotal,
          totalPaidOut,
          JSON.stringify(defaultBankAccounts),
          JSON.stringify(recentPurchases),
          JSON.stringify(defaultPayoutHistory),
          payoutCheck.rows[0].id
        ]
      );
      console.log('✅ Payout profile updated with real cleared and pending balances.');
    }

    console.log('\n🎉 ALL SEED DATA SUCCESSFULLY GENERATED & LINKED!\n');
    console.log('Summary:');
    console.log(`- ${destinations.length} Locations (Destinations)`);
    console.log(`- ${attractions.length} Experiences (Attractions)`);
    console.log(`- ${providers.length} AELI Certified Providers`);
    console.log(`- ${tenPrograms.length} Complete Tour Learning Programs`);
    console.log(`- ${webTransactions.length} Web Registration Booking Transactions`);
    console.log(`- Payout Profile: Rp ${clearedTotal.toLocaleString('id-ID')} Available | Rp ${pendingTotal.toLocaleString('id-ID')} Pending`);

  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execute seed script
runSeed().catch((err) => {
  console.error('Fatal seeding error:', err);
  process.exit(1);
});
