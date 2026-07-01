import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

dotenv.config();

const app = express();
const port = process.env.PORT || 7013;
const dbUrl = process.env.DATABASE_URL;
const gatewayUrl = process.env.GATEWAY_URL || 'http://localhost:7009';

app.use(cors());
app.use(express.json());

// Initialize Database Pool
const pool = new pg.Pool({ connectionString: dbUrl });

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static uploaded files
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.avif')) {
      res.setHeader('Content-Type', 'image/avif');
    }
  }
}));

// Initialize Database Tables
async function initDb() {
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

// Configure Multer storage
const storage = multer.memoryStorage();

// File filter (images and videos only, max 10MB)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif|mp4|mov|avi|avif/i;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and videos are allowed (JPEG, JPG, PNG, WEBP, GIF, MP4, MOV, AVI).'));
  }
});

// PUBLIC ROUTES

// GET media assets of a specific owner (e.g. program or destination)
app.get('/api/v1/media', async (req, res) => {
  const { owner_type, owner_id } = req.query;
  if (!owner_type || !owner_id) {
    return res.status(400).json({ success: false, error: 'owner_type and owner_id are required' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT * FROM media.media_assets
       WHERE owner_type = $1 AND owner_id = $2
       ORDER BY order_index ASC, created_at DESC;`,
      [owner_type, owner_id]
    );
    res.json({ success: true, data: rows });
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

// Upload Media Asset
app.post('/api/v1/admin/media/upload', checkEditorRole, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size exceeds maximum limit of 10MB' });
      }
      return res.status(400).json({ success: false, error: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { owner_type, owner_id, caption, order_index } = req.body;
    if (!owner_type || !owner_id) {
      return res.status(400).json({ success: false, error: 'owner_type and owner_id are required' });
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    
    let filename = '';
    let fileType = 'photo';

    if (isVideo) {
      filename = uniqueSuffix + path.extname(req.file.originalname);
      fileType = 'video';
    } else {
      filename = `${uniqueSuffix}.avif`;
      fileType = 'photo';
    }

    const filePath = path.join(uploadsDir, filename);
    const fileUrl = `/uploads/${filename}`;

    try {
      if (isVideo) {
        fs.writeFileSync(filePath, req.file.buffer);
      } else {
        // Convert to AVIF format using sharp
        await sharp(req.file.buffer)
          .toFormat('avif')
          .toFile(filePath);
      }

      const { rows } = await pool.query(
        `INSERT INTO media.media_assets (owner_type, owner_id, url, type, caption, order_index)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
        [owner_type, owner_id, fileUrl, fileType, caption || '', parseInt(order_index || '0')]
      );

      res.status(211).json({ success: true, data: rows[0] });
    } catch (dbErr: any) {
      // clean up local file if write or DB insert fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      res.status(500).json({ success: false, error: dbErr.message });
    }
  });
});

// Delete Media Asset
app.delete('/api/v1/admin/media/:id', checkEditorRole, async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch file info from DB
    const { rows } = await pool.query('SELECT * FROM media.media_assets WHERE id = $1;', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Media asset not found' });
    }

    const asset = rows[0];
    const fileName = path.basename(asset.url);
    const filePath = path.join(uploadsDir, fileName);

    // 2. Delete from DB
    await pool.query('DELETE FROM media.media_assets WHERE id = $1;', [id]);

    // 3. Delete from Local Storage if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Media asset deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Media Service running on port ${port}`);
  });
});
