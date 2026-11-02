import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import programRoutes from './routes/program.routes.js';
import providerRoutes from './routes/provider.routes.js';
import categoryRoutes from './routes/category.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 7012;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/v1', programRoutes);
app.use('/api/v1', providerRoutes);
app.use('/api/v1', categoryRoutes);

// Central Error Handling Middleware
app.use(errorHandler);

// Start service
initDb().then(() => {
  app.listen(port, () => {
    console.log(`Program Service running on port ${port}`);
  });
});

export default app;
