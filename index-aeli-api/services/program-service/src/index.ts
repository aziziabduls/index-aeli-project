import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const app = express();
const port = process.env.PORT || 7012;
const dbUrl = process.env.DATABASE_URL;
const contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://localhost:7011';

app.use(cors());
app.use(express.json());

const pool = new pg.Pool({ connectionString: dbUrl });

// Helper to find seed-data.json
function getSeedData() {
  const possiblePaths = [
    path.join(__dirname, '../seed-data.json'),
    path.join(__dirname, '../../seed-data.json'),
    path.join(__dirname, '../../../seed-data.json'),
    path.join(process.cwd(), 'seed-data.json'),
    path.join(process.cwd(), 'services/program-service/seed-data.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  }
  return null;
}

// Database Initialization & Seeding
async function initDb() {
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

    // Ensure programs table has image and gallery columns
    await pool.query(`
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS image VARCHAR(500);
      ALTER TABLE program.programs ADD COLUMN IF NOT EXISTS gallery TEXT[];
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
    if (parseInt(catCountRes.rows[0].count) === 0) {
      const initialCats = [
        {
          name: "Adventure & Challenge",
          description: "High-energy outdoor exploration including trekking, climbing, water sports, and challenge courses designed to push limits.",
          color: "from-orange-500/10 to-red-500/10 text-orange-600 border-orange-500/20 bg-orange-500/5",
          gradient: "from-orange-500 to-red-600",
        },
        {
          name: "Cultural Immersion",
          description: "Deep engagement with local customs, traditional crafts, heritage performing arts, historical tours, and indigenous village stays.",
          color: "from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-500/20 bg-purple-500/5",
          gradient: "from-purple-500 to-indigo-600",
        },
        {
          name: "Community & Social Impact",
          description: "Travel combined with community service, building local capacity, cultural exchanges, and environmental conservation projects.",
          color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-500/20 bg-emerald-500/5",
          gradient: "from-emerald-500 to-teal-600",
        },
        {
          name: "Nature & Eco Experience",
          description: "Eco-tourism initiatives emphasizing wildlife tracking, pristine environments, rainforest treks, and sustainable wilderness lodging.",
          color: "from-green-500/10 to-emerald-500/10 text-green-600 border-green-500/20 bg-green-500/5",
          gradient: "from-green-500 to-emerald-600",
        },
        {
          name: "Culinary Journey",
          description: "Exploration of traditional gastronomy, organic farm harvesting, culinary heritage trails, and authentic cooking workshops with local chefs.",
          color: "from-yellow-500/10 to-amber-500/10 text-amber-700 border-amber-500/20 bg-amber-500/5",
          gradient: "from-yellow-500 to-amber-600",
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

    // Check if we need to seed programs
    const { rows } = await pool.query('SELECT COUNT(*) FROM program.programs;');
    if (parseInt(rows[0].count) === 0) {
      const seed = getSeedData();
      if (seed) {
        console.log('Seeding program, providers, itineraries, rundowns...');

        // 1. Seed Providers
        const providerNames = [
          'PT. Buana Orbit Tiga Sinergi',
          'INSPIRA',
          'PT. JJC Indonesia Perspective',
          'CV. Nature'
        ];
        const providerIds: string[] = [];
        for (const name of providerNames) {
          const res = await pool.query(
            `INSERT INTO program.providers (legal_name, display_name, contact_info, status)
             VALUES ($1, $1, $2, 'active') RETURNING id;`,
            [name, JSON.stringify({ email: `contact@${name.toLowerCase().replace(/[^a-z]+/g, '')}.com` })]
          );
          providerIds.push(res.rows[0].id);
        }

        // 2. Fetch Destination UUID mapping from content schema
        // This is safe because both schemas are in the same PostgreSQL cluster
        const destMapping: Record<string, string> = {};
        try {
          const destRes = await pool.query('SELECT id, slug FROM content.destinations;');
          for (const d of destRes.rows) {
            destMapping[d.slug] = d.id;
          }
        } catch (e) {
          console.warn('Could not read content.destinations directly, fallback to empty mapping.', e);
        }

        // 3. Seed Programs
        let provIndex = 0;
        for (const tour of seed.tours) {
          const providerId = providerIds[provIndex % providerIds.length];
          provIndex++;

          const destId = destMapping[tour.destinationId] || null;

          const progRes = await pool.query(
            `INSERT INTO program.programs (
               provider_id, destination_id, name, category, location_label,
               short_description, overview, highlights, price_min, price_max,
               price_unit, duration_label, meeting_point, rating, reviews_count, status, image, gallery
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING id;`,
            [
              providerId,
              destId,
              tour.name,
              tour.category || 'Cultural',
              tour.meetingPoint || 'Local Area',
              tour.description,
              tour.description, // fallback overview
              tour.highlights || [],
              tour.price || 0,
              tour.price ? tour.price * 1.2 : null, // mock max price
              'per pax',
              tour.duration || 'Day Tour',
              tour.meetingPoint || '',
              tour.rating || 4.5,
              tour.reviewsCount || 10,
              'published',
              tour.image || '',
              tour.gallery || []
            ]
          );

          const programId = progRes.rows[0].id;

          // Seed Itineraries
          if (tour.itinerary && Array.isArray(tour.itinerary)) {
            let orderIdx = 0;
            for (const item of tour.itinerary) {
              const activitiesStr = Array.isArray(item.activities) ? item.activities.join(', ') : (item.activities || '');
              
              await pool.query(
                `INSERT INTO program.itinerary_stops (program_id, order_index, location_name, unique_feature, activity_challenge)
                 VALUES ($1, $2, $3, $4, $5);`,
                [programId, orderIdx, item.title || 'Stop', activitiesStr, activitiesStr]
              );

              // Parse title for rundown (e.g. "08:30 AM - Morning Departure")
              let timeLabel = item.title || '';
              let location = '';
              if (timeLabel.includes(' - ')) {
                const parts = timeLabel.split(' - ');
                timeLabel = parts[0].trim();
                location = parts[1].trim();
              }

              await pool.query(
                `INSERT INTO program.rundown_items (program_id, order_index, time_label, session_activity, location, facilitator_notes)
                 VALUES ($1, $2, $3, $4, $5, $6);`,
                [programId, orderIdx, timeLabel, activitiesStr, location, 'Standard facilitation notes']
              );

              orderIdx++;
            }
          }

          // Seed Include / Exclude
          if (tour.included && Array.isArray(tour.included)) {
            for (const inc of tour.included) {
              await pool.query(
                `INSERT INTO program.include_exclude_items (program_id, type, description)
                 VALUES ($1, 'include', $2);`,
                [programId, inc]
              );
            }
          }

          if (tour.excluded && Array.isArray(tour.excluded)) {
            for (const exc of tour.excluded) {
              await pool.query(
                `INSERT INTO program.include_exclude_items (program_id, type, description)
                 VALUES ($1, 'exclude', $2);`,
                [programId, exc]
              );
            }
          }
        }
        console.log('Programs seeded successfully.');
      }
    }
  } catch (err) {
    console.error('Error initializing program-service database:', err);
  }
}

// Helper to resolve destination details via Content Service (HTTP request)
async function resolveDestination(destinationId: string | null): Promise<any | null> {
  if (!destinationId) return null;
  try {
    const res = await fetch(`${contentServiceUrl}/internal/destinations/${destinationId}`);
    if (!res.ok) return null;
    const body = await res.json() as any;
    return body.success ? body.data : null;
  } catch (err) {
    console.warn(`Failed to resolve destination ${destinationId} via content-service:`, err);
    return null;
  }
}

// PUBLIC ROUTES

// GET Programs
app.get('/api/v1/programs', async (req, res) => {
  const { category, destination, price_min, price_max, provider_id } = req.query;

  try {
    let query = `
      SELECT p.*, pr.legal_name as provider_name
      FROM program.programs p
      LEFT JOIN program.providers pr ON p.provider_id = pr.id
      WHERE p.status = 'published'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND p.category ILIKE $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (provider_id) {
      query += ` AND p.provider_id = $${paramIndex}`;
      params.push(provider_id);
      paramIndex++;
    }

    if (price_min) {
      query += ` AND p.price_min >= $${paramIndex}`;
      params.push(parseFloat(price_min as string));
      paramIndex++;
    }

    if (price_max) {
      query += ` AND p.price_min <= $${paramIndex}`;
      params.push(parseFloat(price_max as string));
      paramIndex++;
    }

    query += ` ORDER BY p.rating DESC, p.created_at DESC;`;

    const { rows } = await pool.query(query, params);

    // Resolve Destinations dynamically for each program
    const resolvedRows = [];
    for (const row of rows) {
      const dest = await resolveDestination(row.destination_id);
      
      // Fetch related Itineraries
      const itinRes = await pool.query(
        'SELECT id, order_index, location_name, unique_feature, activity_challenge FROM program.itinerary_stops WHERE program_id = $1 ORDER BY order_index ASC;',
        [row.id]
      );

      // Fetch related Rundowns
      const rundownRes = await pool.query(
        'SELECT id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes FROM program.rundown_items WHERE program_id = $1 ORDER BY order_index ASC;',
        [row.id]
      );

      // Fetch Includes/Excludes
      const incExcRes = await pool.query(
        'SELECT id, type, description FROM program.include_exclude_items WHERE program_id = $1;',
        [row.id]
      );

      resolvedRows.push({
        ...row,
        destination: dest || null,
        itinerary: itinRes.rows,
        rundown: rundownRes.rows,
        included: incExcRes.rows.filter(item => item.type === 'include').map(item => item.description),
        excluded: incExcRes.rows.filter(item => item.type === 'exclude').map(item => item.description)
      });
    }

    // Apply destination slug/id filter in application layer if requested
    let finalRows = resolvedRows;
    if (destination) {
      finalRows = resolvedRows.filter(r => 
        r.destination_id === destination || 
        (r.destination && r.destination.slug === destination)
      );
    }

    res.json({ success: true, data: finalRows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Program by ID (Details)
app.get('/api/v1/programs/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const progRes = await pool.query(
      `SELECT p.*, pr.legal_name as provider_name
       FROM program.programs p
       LEFT JOIN program.providers pr ON p.provider_id = pr.id
       WHERE p.id = $1 AND p.status = 'published';`,
      [id]
    );

    if (progRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    const program = progRes.rows[0];

    // Fetch related Itineraries
    const itinRes = await pool.query(
      'SELECT id, order_index, location_name, unique_feature, activity_challenge FROM program.itinerary_stops WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    // Fetch related Rundowns
    const rundownRes = await pool.query(
      'SELECT id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes FROM program.rundown_items WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    // Fetch Includes/Excludes
    const incExcRes = await pool.query(
      'SELECT id, type, description FROM program.include_exclude_items WHERE program_id = $1;',
      [id]
    );

    // Resolve destination details
    const dest = await resolveDestination(program.destination_id);

    res.json({
      success: true,
      data: {
        ...program,
        destination: dest || null,
        itinerary: itinRes.rows,
        rundown: rundownRes.rows,
        included: incExcRes.rows.filter(item => item.type === 'include').map(item => item.description),
        excluded: incExcRes.rows.filter(item => item.type === 'exclude').map(item => item.description)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADMIN ROUTES

function checkEditorRole(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = req.header('x-user-role');
  if (role !== 'super_admin' && role !== 'admin' && role !== 'content_editor') {
    return res.status(403).json({ success: false, error: 'Forbidden: insufficient permissions' });
  }
  next();
}

function checkAdminRole(req: express.Request, res: express.Response, next: express.NextFunction) {
  const role = req.header('x-user-role');
  if (role !== 'super_admin' && role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: admin privilege required' });
  }
  next();
}

// Get admin programs list
app.get('/api/v1/admin/programs', checkEditorRole, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM program.programs ORDER BY created_at DESC;');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get admin program by ID (allows draft/review status)
app.get('/api/v1/admin/programs/:id', checkEditorRole, async (req, res) => {
  const { id } = req.params;
  try {
    const progRes = await pool.query(
      `SELECT p.*, pr.legal_name as provider_name
       FROM program.programs p
       LEFT JOIN program.providers pr ON p.provider_id = pr.id
       WHERE p.id = $1;`,
      [id]
    );

    if (progRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    const program = progRes.rows[0];

    // Fetch related Itineraries
    const itinRes = await pool.query(
      'SELECT id, order_index, location_name, unique_feature, activity_challenge FROM program.itinerary_stops WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    // Fetch related Rundowns
    const rundownRes = await pool.query(
      'SELECT id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes FROM program.rundown_items WHERE program_id = $1 ORDER BY order_index ASC;',
      [id]
    );

    // Fetch Includes/Excludes
    const incExcRes = await pool.query(
      'SELECT id, type, description FROM program.include_exclude_items WHERE program_id = $1;',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...program,
        itinerary: itinRes.rows,
        rundown: rundownRes.rows,
        included: incExcRes.rows.filter(item => item.type === 'include').map(item => item.description),
        excluded: incExcRes.rows.filter(item => item.type === 'exclude').map(item => item.description)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create admin program (supports nested itinerary, rundown, included, excluded)
app.post('/api/v1/admin/programs', checkEditorRole, async (req, res) => {
  const {
    id, provider_id, destination_id, attraction_id, name, category, location_label,
    short_description, overview, highlights, price_min, price_max,
    price_unit, price_note, duration_label, max_guest_min, max_guest_max,
    meeting_point, itinerary, rundown, included, excluded, image, gallery
  } = req.body;

  if (!provider_id || !name || !category || !location_label || !short_description || !duration_label) {
    return res.status(400).json({ success: false, error: 'Required fields are missing' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const progRes = await client.query(
      `INSERT INTO program.programs (
         id, provider_id, destination_id, attraction_id, name, category, location_label,
         short_description, overview, highlights, price_min, price_max,
         price_unit, price_note, duration_label, max_guest_min, max_guest_max,
         meeting_point, status, image, gallery
       ) VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'draft', $19, $20) RETURNING *;`,
      [
        id || null, provider_id, destination_id || null, attraction_id || null, name, category, location_label,
        short_description, overview || '', highlights || [], price_min || null, price_max || null,
        price_unit || '', price_note || '', duration_label, max_guest_min || null, max_guest_max || null,
        meeting_point || '', image || '', gallery || []
      ]
    );

    const program = progRes.rows[0];

    // Save nested Itinerary Stops
    if (itinerary && Array.isArray(itinerary)) {
      let orderIdx = 0;
      for (const item of itinerary) {
        await client.query(
          `INSERT INTO program.itinerary_stops (program_id, order_index, location_name, unique_feature, activity_challenge)
           VALUES ($1, $2, $3, $4, $5);`,
          [program.id, orderIdx++, item.location_name, item.unique_feature || '', item.activity_challenge || '']
        );
      }
    }

    // Save nested Rundowns
    if (rundown && Array.isArray(rundown)) {
      let orderIdx = 0;
      for (const item of rundown) {
        await client.query(
          `INSERT INTO program.rundown_items (program_id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [program.id, orderIdx++, item.time_label, item.duration_minutes || null, item.session_activity, item.location || '', item.facilitator_notes || '']
        );
      }
    }

    // Save nested Includes/Excludes
    if (included && Array.isArray(included)) {
      for (const desc of included) {
        await client.query(
          `INSERT INTO program.include_exclude_items (program_id, type, description)
           VALUES ($1, 'include', $2);`,
          [program.id, desc]
        );
      }
    }

    if (excluded && Array.isArray(excluded)) {
      for (const desc of excluded) {
        await client.query(
          `INSERT INTO program.include_exclude_items (program_id, type, description)
           VALUES ($1, 'exclude', $2);`,
          [program.id, desc]
        );
      }
    }

    await client.query('COMMIT');
    res.status(211).json({ success: true, data: program });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Update Program
app.put('/api/v1/admin/programs/:id', checkEditorRole, async (req, res) => {
  const { id } = req.params;
  const {
    provider_id, destination_id, attraction_id, name, category, location_label,
    short_description, overview, highlights, price_min, price_max,
    price_unit, price_note, duration_label, max_guest_min, max_guest_max,
    meeting_point, itinerary, rundown, included, excluded, image, gallery
  } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const progRes = await client.query(
      `UPDATE program.programs
       SET provider_id = $1, destination_id = $2, attraction_id = $3, name = $4, category = $5, location_label = $6,
           short_description = $7, overview = $8, highlights = $9, price_min = $10, price_max = $11,
           price_unit = $12, price_note = $13, duration_label = $14, max_guest_min = $15, max_guest_max = $16,
           meeting_point = $17, updated_at = NOW(), image = $18, gallery = $19
       WHERE id = $20 RETURNING *;`,
      [
        provider_id, destination_id || null, attraction_id || null, name, category, location_label,
        short_description, overview, highlights, price_min, price_max,
        price_unit, price_note, duration_label, max_guest_min, max_guest_max,
        meeting_point, image, gallery, id
      ]
    );

    if (progRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Program not found' });
    }

    const program = progRes.rows[0];

    // Replace nested Itinerary Stops
    await client.query('DELETE FROM program.itinerary_stops WHERE program_id = $1;', [id]);
    if (itinerary && Array.isArray(itinerary)) {
      let orderIdx = 0;
      for (const item of itinerary) {
        await client.query(
          `INSERT INTO program.itinerary_stops (program_id, order_index, location_name, unique_feature, activity_challenge)
           VALUES ($1, $2, $3, $4, $5);`,
          [id, orderIdx++, item.location_name, item.unique_feature || '', item.activity_challenge || '']
        );
      }
    }

    // Replace nested Rundowns
    await client.query('DELETE FROM program.rundown_items WHERE program_id = $1;', [id]);
    if (rundown && Array.isArray(rundown)) {
      let orderIdx = 0;
      for (const item of rundown) {
        await client.query(
          `INSERT INTO program.rundown_items (program_id, order_index, time_label, duration_minutes, session_activity, location, facilitator_notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7);`,
          [id, orderIdx++, item.time_label, item.duration_minutes || null, item.session_activity, item.location || '', item.facilitator_notes || '']
        );
      }
    }

    // Replace Includes/Excludes
    await client.query('DELETE FROM program.include_exclude_items WHERE program_id = $1;', [id]);
    if (included && Array.isArray(included)) {
      for (const desc of included) {
        await client.query(
          `INSERT INTO program.include_exclude_items (program_id, type, description)
           VALUES ($1, 'include', $2);`,
          [id, desc]
        );
      }
    }

    if (excluded && Array.isArray(excluded)) {
      for (const desc of excluded) {
        await client.query(
          `INSERT INTO program.include_exclude_items (program_id, type, description)
           VALUES ($1, 'exclude', $2);`,
          [id, desc]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: program });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ success: false, error: err.message });
  } finally {
    client.release();
  }
});

// Update Program Status (Publish/Unpublish)
app.patch('/api/v1/admin/programs/:id/status', checkAdminRole, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'review', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE program.programs SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Program not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Providers
app.get('/api/v1/admin/providers', checkEditorRole, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM program.providers ORDER BY legal_name ASC;');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/admin/providers', checkEditorRole, async (req, res) => {
  const { legal_name, display_name, contact_info } = req.body;
  if (!legal_name) {
    return res.status(400).json({ success: false, error: 'legal_name is required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO program.providers (legal_name, display_name, contact_info, status)
       VALUES ($1, $2, $3, 'active') RETURNING *;`,
      [legal_name, display_name || legal_name, JSON.stringify(contact_info || {})]
    );
    res.status(211).json({ success: true, data: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Provider with this name already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/admin/providers/:id', checkEditorRole, async (req, res) => {
  const { id } = req.params;
  const { legal_name, display_name, contact_info, status } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE program.providers
       SET legal_name = $1, display_name = $2, contact_info = $3, status = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *;`,
      [legal_name, display_name, JSON.stringify(contact_info || {}), status || 'active', id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Provider not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all categories (public)
app.get('/api/v1/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM program.categories ORDER BY name ASC;');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all categories (admin)
app.get('/api/v1/admin/categories', checkEditorRole, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM program.categories ORDER BY name ASC;');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create category (admin)
app.post('/api/v1/admin/categories', checkEditorRole, async (req, res) => {
  const { name, description, color, gradient } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: 'Category name is required' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO program.categories (name, description, color, gradient)
       VALUES ($1, $2, $3, $4) RETURNING *;`,
      [
        name.trim(),
        description || 'Custom user-defined category specified during program setup.',
        color || 'from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-500/20 bg-sky-500/5',
        gradient || 'from-sky-500 to-blue-600'
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') { // Unique violation
      return res.status(409).json({ success: false, error: 'Category with this name already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Program Service running on port ${port}`);
  });
});
