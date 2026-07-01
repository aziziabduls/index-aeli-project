import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

const app = express();
const port = process.env.PORT || 7011;
const dbUrl = process.env.DATABASE_URL;

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
    path.join(process.cwd(), 'services/content-service/seed-data.json')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log(`Found seed data at: ${p}`);
      return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
  }
  console.warn('Seed data not found, starting with empty database.');
  return null;
}

// Database Initialization & Seeding
async function initDb() {
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

    // Update existing seeded destinations with quick facts and weather if they are empty
    try {
      const { rows: existingRows } = await pool.query("SELECT id, slug, capital FROM content.destinations;");
      const hasEmptyFacts = existingRows.some(r => !r.capital);
      if (hasEmptyFacts) {
        const seed = getSeedData();
        if (seed) {
          console.log('Updating existing destinations with quick facts and weather from seed data...');
          for (const dest of seed.destinations) {
            await pool.query(
              `UPDATE content.destinations 
               SET capital = COALESCE(NULLIF(capital, ''), $1),
                   population = COALESCE(NULLIF(population, ''), $2),
                   language = COALESCE(NULLIF(language, ''), $3),
                   timezone = COALESCE(NULLIF(timezone, ''), $4),
                   weather_temperature = COALESCE(NULLIF(weather_temperature, ''), $5),
                   weather_condition = COALESCE(NULLIF(weather_condition, ''), $6)
               WHERE slug = $7;`,
              [
                dest.quickFacts?.capital || '',
                dest.quickFacts?.population || '',
                dest.quickFacts?.language || '',
                dest.quickFacts?.timezone || '',
                dest.weather?.temperature || '',
                dest.weather?.condition || '',
                dest.slug || dest.id
              ]
            );
          }
        }
      }
    } catch (updateErr) {
      console.warn('Could not auto-populate quick facts or weather columns:', updateErr);
    }

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

    // Check if we need to seed
    const { rows } = await pool.query('SELECT COUNT(*) FROM content.destinations;');
    if (parseInt(rows[0].count) === 0) {
      const seed = getSeedData();
      if (seed) {
        console.log('Seeding destinations and attractions...');
        
        // 1. Seed Destinations
        const destSlugToUuid: Record<string, string> = {};
        for (const dest of seed.destinations) {
          const res = await pool.query(
            `INSERT INTO content.destinations (name, slug, description, overview, best_time_to_visit, is_popular, status, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING id;`,
            [
              dest.name,
              dest.slug || dest.id,
              dest.description,
              dest.description, // fallback overview to description
              dest.bestTimeToVisit || '',
              true, // seed as popular
              'published',
              dest.image || '',
              dest.gallery || [],
              dest.quickFacts?.capital || '',
              dest.quickFacts?.population || '',
              dest.quickFacts?.language || '',
              dest.quickFacts?.timezone || '',
              dest.weather?.temperature || '',
              dest.weather?.condition || ''
            ]
          );
          destSlugToUuid[dest.id] = res.rows[0].id;
        }

        // 2. Seed Attractions
        for (const attr of seed.attractions) {
          const destId = destSlugToUuid[attr.destinationId];
          if (!destId) continue;
          
          await pool.query(
            `INSERT INTO content.attractions (destination_id, name, slug, location_label, description, about, historical_background, operational_hours, facilities, status, image, gallery)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
            [
              destId,
              attr.name,
              attr.slug || attr.id,
              attr.location || '',
              attr.description || '',
              attr.description || '', // about fallback
              attr.history || '',
              attr.openingHours || '',
              attr.facilities || [],
              'published',
              attr.image || '',
              attr.gallery || []
            ]
          );
        }

        // 3. Seed default CTA Sections
        await pool.query(
          `INSERT INTO content.cta_sections (scope, title, body, button_text, button_link, status)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            'homepage',
            'Why Travel with INDEX-AELI?',
            'INDEX-AELI brings you closer to the authentic beauty, vibrant heritage, and majestic nature of Indonesia. Our curated programs are run by verified local guides and support local communities directly.',
            'Explore Programs',
            '/programs',
            'published'
          ]
        );

        console.log('Content seed completed successfully.');
      }
    }
  } catch (err) {
    console.error('Error initializing content-service database:', err);
  }
}

// PUBLIC ROUTES

// GET Destinations (List)
app.get('/api/v1/destinations', async (req, res) => {
  const { is_popular, search } = req.query;
  try {
    let query = `
      SELECT d.*, COALESCE(COUNT(a.id)::int, 0) as attraction_count
      FROM content.destinations d
      LEFT JOIN content.attractions a ON d.id = a.destination_id
      WHERE d.status = 'published'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (is_popular === 'true') {
      query += ` AND d.is_popular = true`;
    }

    if (search) {
      query += ` AND (d.name ILIKE $${paramIndex} OR d.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` GROUP BY d.id ORDER BY d.is_popular DESC, attraction_count DESC;`;

    const { rows } = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Destination by ID or Slug
app.get('/api/v1/destinations/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  try {
    const query = isUuid
      ? `SELECT d.*, COALESCE(COUNT(a.id)::int, 0) as attraction_count
         FROM content.destinations d
         LEFT JOIN content.attractions a ON d.id = a.destination_id
         WHERE d.id = $1 AND d.status = 'published'
         GROUP BY d.id;`
      : `SELECT d.*, COALESCE(COUNT(a.id)::int, 0) as attraction_count
         FROM content.destinations d
         LEFT JOIN content.attractions a ON d.id = a.destination_id
         WHERE d.slug = $1 AND d.status = 'published'
         GROUP BY d.id;`;
    const { rows } = await pool.query(query, [idOrSlug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Attractions for a Destination (by ID or Slug)
app.get('/api/v1/destinations/:idOrSlug/attractions', async (req, res) => {
  const { idOrSlug } = req.params;
  const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  try {
    const query = isUuid
      ? 'SELECT id FROM content.destinations WHERE id = $1 AND status = \'published\';'
      : 'SELECT id FROM content.destinations WHERE slug = $1 AND status = \'published\';';
    const destRes = await pool.query(query, [idOrSlug]);
    if (destRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }
    
    const destId = destRes.rows[0].id;
    const { rows } = await pool.query(
      'SELECT * FROM content.attractions WHERE destination_id = $1 AND status = \'published\' ORDER BY name ASC;',
      [destId]
    );
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Attraction Detail by ID or Slug
app.get('/api/v1/attractions/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const isUuid = idOrSlug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  try {
    const query = isUuid 
      ? 'SELECT * FROM content.attractions WHERE id = $1 AND status = \'published\';'
      : 'SELECT * FROM content.attractions WHERE slug = $1 AND status = \'published\';';
      
    const { rows } = await pool.query(query, [idOrSlug]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attraction not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Active CTA by Scope
app.get('/api/v1/cta', async (req, res) => {
  const { scope } = req.query;
  if (!scope) {
    return res.status(400).json({ success: false, error: 'Scope query parameter is required' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM content.cta_sections WHERE scope = $1 AND status = \'published\' LIMIT 1;',
      [scope]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'CTA Section not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// INTERNAL ROUTES (For program service to resolve destination info by ID)
app.get('/internal/destinations/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT id, name, slug FROM content.destinations WHERE id = $1;', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ADMIN ROUTES (Gateway passes role check header)

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

// Admin Destinations
app.get('/api/v1/admin/destinations', checkEditorRole, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM content.destinations ORDER BY created_at DESC;');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/v1/admin/destinations', checkEditorRole, async (req, res) => {
  const { id, name, description, overview, best_time_to_visit, is_popular, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition } = req.body;
  if (!name || !description) {
    return res.status(400).json({ success: false, error: 'Name and description are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const userId = req.header('x-user-id') || null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO content.destinations (id, name, slug, description, overview, best_time_to_visit, is_popular, status, created_by, updated_by, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition)
       VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, 'draft', $8, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *;`,
      [id || null, name, slug, description, overview || '', best_time_to_visit || '', is_popular || false, userId, image || '', gallery || [], capital || '', population || '', language || '', timezone || '', weather_temperature || '', weather_condition || '']
    );
    res.status(211).json({ success: true, data: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Destination name/slug already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/admin/destinations/:id', checkEditorRole, async (req, res) => {
  const { id } = req.params;
  const { name, description, overview, best_time_to_visit, is_popular, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition } = req.body;
  const userId = req.header('x-user-id') || null;

  try {
    const { rows } = await pool.query(
      `UPDATE content.destinations
       SET name = $1, description = $2, overview = $3, best_time_to_visit = $4, is_popular = $5, updated_by = $6, updated_at = NOW(), image = $7, gallery = $8, capital = $9, population = $10, language = $11, timezone = $12, weather_temperature = $13, weather_condition = $14
       WHERE id = $15 RETURNING *;`,
      [name, description, overview, best_time_to_visit, is_popular, userId, image, gallery, capital, population, language, timezone, weather_temperature, weather_condition, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/v1/admin/destinations/:id/status', checkAdminRole, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['draft', 'review', 'published', 'archived'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status value' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE content.destinations SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/v1/admin/destinations/:id', checkAdminRole, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM content.destinations WHERE id = $1;', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Destination not found' });
    }
    res.json({ success: true, message: 'Destination deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Attractions
app.post('/api/v1/admin/attractions', checkEditorRole, async (req, res) => {
  const { id, destination_id, name, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, image, gallery } = req.body;
  
  if (!destination_id || !name || !location_label || !description) {
    return res.status(400).json({ success: false, error: 'destination_id, name, location_label, and description are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  try {
    const { rows } = await pool.query(
      `INSERT INTO content.attractions (id, destination_id, name, slug, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, status, image, gallery)
       VALUES (COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', $14, $15) RETURNING *;`,
      [id || null, destination_id, name, slug, location_label, description, about || '', historical_background || '', operational_hours || '', latitude || null, longitude || null, entrance_access_info || '', facilities || [], image || '', gallery || []]
    );
    res.status(211).json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/admin/attractions/:id', checkEditorRole, async (req, res) => {
  const { id } = req.params;
  const { name, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, image, gallery } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE content.attractions
       SET name = $1, location_label = $2, description = $3, about = $4, historical_background = $5, operational_hours = $6, latitude = $7, longitude = $8, entrance_access_info = $9, facilities = $10, updated_at = NOW(), image = $11, gallery = $12
       WHERE id = $13 RETURNING *;`,
      [name, location_label, description, about, historical_background, operational_hours, latitude, longitude, entrance_access_info, facilities, image, gallery, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attraction not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/v1/admin/attractions/:id/status', checkAdminRole, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { rows } = await pool.query(
      'UPDATE content.attractions SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
      [status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Attraction not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET all admin attractions
app.get('/api/v1/admin/attractions', checkEditorRole, async (req, res) => {
  try {
    const query = `
      SELECT a.*, d.name as destination_name, d.slug as destination_slug
      FROM content.attractions a
      LEFT JOIN content.destinations d ON a.destination_id = d.id
      ORDER BY a.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE admin attraction
app.delete('/api/v1/admin/attractions/:id', checkAdminRole, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM content.attractions WHERE id = $1;', [id]);
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Attraction not found' });
    }
    res.json({ success: true, message: 'Attraction deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin CTA
app.get('/api/v1/admin/cta', checkEditorRole, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM content.cta_sections ORDER BY scope ASC;');
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/v1/admin/cta/:id', checkEditorRole, async (req, res) => {
  const { id } = req.params;
  const { title, body, button_text, button_link, status } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE content.cta_sections
       SET title = $1, body = $2, button_text = $3, button_link = $4, status = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *;`,
      [title, body, button_text, button_link, status, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'CTA Section not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Content Service running on port ${port}`);
  });
});
