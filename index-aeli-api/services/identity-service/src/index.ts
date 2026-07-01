import express from 'express';
import cors from 'cors';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 7010;
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey123!';

app.use(cors());
app.use(express.json());

// Initialize Database Pool
const pool = new pg.Pool({ connectionString: dbUrl });

// Helper to init schema & tables
async function initDb() {
  try {
    await pool.query('CREATE SCHEMA IF NOT EXISTS identity;');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS identity.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'viewer',
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default users if empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM identity.users;');
    if (parseInt(rows[0].count) === 0) {
      console.log('Seeding default users in identity service...');
      const usersToSeed = [
        { email: 'superadmin@indexaeli.com', password: 'superadminpassword', role: 'super_admin' },
        { email: 'admin@indexaeli.com', password: 'adminpassword', role: 'admin' },
        { email: 'editor@indexaeli.com', password: 'editorpassword', role: 'content_editor' },
        { email: 'viewer@indexaeli.com', password: 'viewerpassword', role: 'viewer' }
      ];

      for (const u of usersToSeed) {
        const hash = await bcrypt.hash(u.password, 10);
        await pool.query(
          'INSERT INTO identity.users (email, password_hash, role) VALUES ($1, $2, $3);',
          [u.email, hash, u.role]
        );
      }
      console.log('Default users seeded successfully.');
    }
  } catch (err) {
    console.error('Error initializing identity-service database:', err);
  }
}

// Active sessions in memory for tracking refresh tokens (Fase 1 simplicity)
const refreshTokens = new Set<string>();

// Login Route
app.post('/api/v1/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM identity.users WHERE email = $1;', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const user = rows[0];
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'User account is inactive' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // Generate JWTs
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    refreshTokens.add(refreshToken);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role }
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register Route
app.post('/api/v1/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO identity.users (email, password_hash, role, status) VALUES ($1, $2, $3, $4) RETURNING id, email, role, status, created_at;',
      [email, hash, 'viewer', 'active']
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// Refresh Route
app.post('/api/v1/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'Refresh token is required' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(403).json({ success: false, error: 'Invalid refresh token' });
  }

  try {
    const payload = jwt.verify(refreshToken, jwtSecret) as any;
    const accessToken = jwt.sign(
      { id: payload.id, email: payload.email, role: payload.role },
      jwtSecret,
      { expiresIn: '15m' }
    );
    res.json({ success: true, data: { accessToken } });
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid refresh token' });
  }
});

// Logout Route
app.post('/api/v1/auth/logout', (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET list of users (Requires admin/super_admin role header from gateway)
app.get('/api/v1/users', async (req, res) => {
  const role = req.header('x-user-role');
  if (role !== 'super_admin' && role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: access denied' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, email, role, status, created_at, updated_at FROM identity.users ORDER BY created_at DESC;'
    );
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET list of roles with user count (Requires admin/super_admin role header from gateway)
app.get('/api/v1/roles', async (req, res) => {
  const role = req.header('x-user-role');
  if (role !== 'super_admin' && role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: access denied' });
  }

  try {
    const { rows: counts } = await pool.query(
      'SELECT role, COUNT(*)::int as count FROM identity.users GROUP BY role;'
    );

    const countMap = counts.reduce((acc: any, row: any) => {
      acc[row.role] = row.count;
      return acc;
    }, {});

    const systemRoles = [
      {
        role: "Super Admin",
        group: "System roles",
        accessLevel: "Full",
        users: countMap['super_admin'] || 0,
        permissionSets: ["Users", "Roles", "Settings", "Billing", "Reports", "Integrations", "Audit Logs"],
        lastReview: "Jun 30, 2026",
        owner: "System",
        status: "Active"
      },
      {
        role: "Admin",
        group: "System roles",
        accessLevel: "Full",
        users: countMap['admin'] || 0,
        permissionSets: ["Users", "Settings", "Reports", "Billing", "Integrations"],
        lastReview: "Jun 30, 2026",
        owner: "System",
        status: "Active"
      },
      {
        role: "Content Editor",
        group: "System roles",
        accessLevel: "Scoped",
        users: countMap['content_editor'] || 0,
        permissionSets: ["Content", "Publish", "Media"],
        lastReview: "Jun 30, 2026",
        owner: "System",
        status: "Active"
      },
      {
        role: "Viewer",
        group: "System roles",
        accessLevel: "Read only",
        users: countMap['viewer'] || 0,
        permissionSets: ["Reports", "Dashboards"],
        lastReview: "Jun 30, 2026",
        owner: "System",
        status: "Active"
      }
    ];

    res.json({ success: true, data: systemRoles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create user (Requires super_admin role header from gateway)
app.post('/api/v1/users', async (req, res) => {
  const role = req.header('x-user-role');
  if (role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: super_admin only' });
  }

  const { email, password, role: userRole } = req.body;
  if (!email || !password || !userRole) {
    return res.status(400).json({ success: false, error: 'Email, password, and role are required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO identity.users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, status, created_at;',
      [email, hash, userRole]
    );
    res.status(211).json({ success: true, data: rows[0] });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ success: false, error: 'Email already exists' });
    }
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH change user role or status (Requires super_admin)
app.patch('/api/v1/users/:id/role', async (req, res) => {
  const role = req.header('x-user-role');
  if (role !== 'super_admin') {
    return res.status(403).json({ success: false, error: 'Forbidden: super_admin only' });
  }

  const { id } = req.params;
  const { role: newRole, status } = req.body;

  try {
    let query = 'UPDATE identity.users SET ';
    const params: any[] = [];
    let paramIndex = 1;

    if (newRole) {
      query += `role = $${paramIndex++}, `;
      params.push(newRole);
    }
    if (status) {
      query += `status = $${paramIndex++}, `;
      params.push(status);
    }

    if (params.length === 0) {
      return res.status(400).json({ success: false, error: 'Nothing to update' });
    }

    query += `updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, email, role, status, updated_at;`;
    params.push(id);

    const { rows } = await pool.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Identity Service running on port ${port}`);
  });
});
