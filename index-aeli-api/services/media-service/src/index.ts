import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { initDb } from './db.js';
import mediaRoutes from './routes/media.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 7013;

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static uploaded files
app.use(
  '/uploads',
  express.static(uploadsDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.avif')) {
        res.setHeader('Content-Type', 'image/avif');
      }
    }
  })
);

// Routes
app.use('/api/v1', mediaRoutes);

// Central Error Handling Middleware
app.use(errorHandler);

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Media Service running on port ${port}`);
  });
});

export default app;
