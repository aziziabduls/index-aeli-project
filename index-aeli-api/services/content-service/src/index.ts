import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import destinationRoutes from './routes/destination.routes.js';
import attractionRoutes from './routes/attraction.routes.js';
import ctaRoutes from './routes/cta.routes.js';
import appConfigRoutes from './routes/app-config.routes.js';
import internalRoutes from './routes/internal.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 7011;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', destinationRoutes);
app.use('/api/v1', attractionRoutes);
app.use('/api/v1', ctaRoutes);
app.use('/api/v1', appConfigRoutes);
app.use('/internal', internalRoutes);

// Central Error Handling Middleware
app.use(errorHandler);

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Content Service running on port ${port}`);
  });
});

export default app;
