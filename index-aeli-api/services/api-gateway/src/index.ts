import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { initDb } from './db.js';
import { authMiddleware, protectAdminRoutes, CustomRequest } from './middlewares/auth.middleware.js';
import { auditLoggingMiddleware } from './middlewares/audit.middleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 7009;

const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 'http://localhost:7010';
const contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://localhost:7011';
const programServiceUrl = process.env.PROGRAM_SERVICE_URL || 'http://localhost:7012';
const mediaServiceUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:7013';

// Log requests
app.use(morgan('dev'));

// CORS Setup allowing index-aeli-cms and index-aeli-web
app.use(cors({
  origin: [
    'http://localhost:7008',
    'http://localhost:7007',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'http://localhost:3006',
    'http://localhost:3007',
    'http://localhost:3008',
    'http://localhost:3009'
  ],
  credentials: true
}));

// Rate Limiting for public endpoints (to prevent spam)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Apply rate limiting to login endpoint
app.use('/api/v1/auth/login', apiLimiter);

// JWT & Route Protection Middlewares
app.use(authMiddleware);
app.use(protectAdminRoutes);

// Audit Logging Middleware for write/mutation endpoints
app.use(auditLoggingMiddleware);

// Proxy Routes Configuration
const proxyOptions = {
  changeOrigin: true,
  on: {
    proxyReq: (proxyReq: any, req: any) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
        proxyReq.setHeader('x-user-email', req.user.email);
      }
    }
  }
};

// 1. Identity Service Proxies
app.use(createProxyMiddleware({
  ...proxyOptions,
  target: identityServiceUrl,
  pathFilter: (path) =>
    path.startsWith('/api/v1/auth') ||
    path.startsWith('/api/v1/users') ||
    path.startsWith('/api/v1/roles') ||
    path.startsWith('/api/v1/billing') ||
    path.startsWith('/api/v1/notifications') ||
    path.startsWith('/api/v1/payout')
}));

// 2. Content Service Proxies
app.use(createProxyMiddleware({
  ...proxyOptions,
  target: contentServiceUrl,
  pathFilter: (path) =>
    path.startsWith('/api/v1/destinations') ||
    path.startsWith('/api/v1/attractions') ||
    path.startsWith('/api/v1/cta') ||
    path.startsWith('/api/v1/app-config') ||
    path.startsWith('/api/v1/admin/destinations') ||
    path.startsWith('/api/v1/admin/attractions') ||
    path.startsWith('/api/v1/admin/cta') ||
    path.startsWith('/api/v1/admin/app-config')
}));

// 3. Program Service Proxies
app.use(createProxyMiddleware({
  ...proxyOptions,
  target: programServiceUrl,
  pathFilter: (path) =>
    path.startsWith('/api/v1/programs') ||
    path.startsWith('/api/v1/admin/programs') ||
    path.startsWith('/api/v1/admin/providers') ||
    path.startsWith('/api/v1/categories') ||
    path.startsWith('/api/v1/admin/categories')
}));

// 4. Media Service Proxies (including static file uploads directory)
app.use(createProxyMiddleware({
  ...proxyOptions,
  target: mediaServiceUrl,
  pathFilter: (path) =>
    path.startsWith('/api/v1/media') ||
    path.startsWith('/api/v1/admin/media') ||
    path.startsWith('/uploads')
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'Gateway' });
});

// Start Gateway
initDb().then(() => {
  app.listen(port, () => {
    console.log(`API Gateway running on port ${port}`);
  });
});

export default app;
