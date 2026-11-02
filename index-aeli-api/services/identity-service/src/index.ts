import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 7010;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', userRoutes);

// Central Error Handling Middleware
app.use(errorHandler);

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Identity Service running on port ${port}`);
  });
});

export default app;
