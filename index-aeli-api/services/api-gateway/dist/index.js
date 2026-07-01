"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pg_1 = __importDefault(require("pg"));
const morgan_1 = __importDefault(require("morgan"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = require("express-rate-limit");
const http_proxy_middleware_1 = require("http-proxy-middleware");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 7009;
const dbUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkey123!';
const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 'http://localhost:7010';
const contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://localhost:7011';
const programServiceUrl = process.env.PROGRAM_SERVICE_URL || 'http://localhost:7012';
const mediaServiceUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:7013';
// Initialize PG Pool for Audit Logging
const pool = new pg_1.default.Pool({ connectionString: dbUrl });
// Initialize Audit Database Schema
async function initDb() {
    try {
        await pool.query('CREATE SCHEMA IF NOT EXISTS audit;');
        await pool.query(`
      CREATE TABLE IF NOT EXISTS audit.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id UUID,
        entity_type VARCHAR(100),
        entity_id UUID,
        action VARCHAR(50),
        diff JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    }
    catch (err) {
        console.error('Error initializing audit database:', err);
    }
}
// Log requests
app.use((0, morgan_1.default)('dev'));
// CORS Setup allowing index-aeli-cms and index-aeli-web
app.use((0, cors_1.default)({
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
const apiLimiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests from this IP, please try again after 15 minutes.' }
});
// Apply rate limiting to all public endpoints (not admin)
app.use('/api/v1/auth/login', apiLimiter);
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, error: 'Session expired', code: 'SESSION_EXPIRED' });
        }
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
};
const protectAdminRoutes = (req, res, next) => {
    const isProtectedPath = req.path.startsWith('/api/v1/admin/') ||
        req.path.startsWith('/api/v1/users') ||
        req.path.startsWith('/api/v1/roles');
    if (isProtectedPath && !req.user) {
        return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }
    next();
};
app.use(authMiddleware);
app.use(protectAdminRoutes);
// Audit Logging Middleware for write/mutation endpoints
const auditLoggingMiddleware = async (req, res, next) => {
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const isAdminRoute = req.path.includes('/admin/');
    if (isWrite && isAdminRoute) {
        // Intercept JSON body for diffs
        let body = {};
        if (req.headers['content-type']?.includes('application/json')) {
            // Temporarily store the body for logging
            // Since proxy middleware consumes body, we will need to rebuild it if we parse it,
            // but Express JSON bodyparser is NOT active globally here because it breaks file upload proxies!
            // This is a crucial detail: to avoid breaking file uploads, we do NOT use app.use(express.json()) at the gateway level.
            // Instead, we only parse JSON body on routes we know don't upload files, or just log basic metadata.
            // Let's log metadata (method, route, actor) to avoid breaking proxy streams.
        }
        res.on('finish', async () => {
            // Only log if response was successful (2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const actorId = req.user?.id || null;
                if (!actorId)
                    return;
                // Deduce entity type from route
                let entityType = 'unknown';
                if (req.path.includes('/destinations'))
                    entityType = 'destination';
                else if (req.path.includes('/attractions'))
                    entityType = 'attraction';
                else if (req.path.includes('/programs'))
                    entityType = 'program';
                else if (req.path.includes('/providers'))
                    entityType = 'provider';
                else if (req.path.includes('/categories'))
                    entityType = 'category';
                else if (req.path.includes('/media'))
                    entityType = 'media';
                else if (req.path.includes('/cta'))
                    entityType = 'cta';
                // Deduce action
                let action = 'update';
                if (req.method === 'POST')
                    action = 'create';
                else if (req.method === 'DELETE')
                    action = 'delete';
                else if (req.method === 'PATCH' && req.path.includes('/status')) {
                    action = 'publish'; // or unpublish, simplified to publish/status change
                }
                // Try to get ID from path params
                const parts = req.path.split('/');
                const entityId = parts.find(p => p.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) || null;
                try {
                    await pool.query(`INSERT INTO audit.audit_logs (actor_id, entity_type, entity_id, action, diff)
             VALUES ($1, $2, $3, $4, $5);`, [actorId, entityType, entityId, action, JSON.stringify({ path: req.path, method: req.method })]);
                }
                catch (err) {
                    console.error('Failed to write audit log:', err);
                }
            }
        });
    }
    next();
};
app.use(auditLoggingMiddleware);
// Proxy Routes Configuration
// We pass user headers to downstream services if verified
const proxyOptions = {
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req, res) => {
            if (req.user) {
                proxyReq.setHeader('x-user-id', req.user.id);
                proxyReq.setHeader('x-user-role', req.user.role);
                proxyReq.setHeader('x-user-email', req.user.email);
            }
        }
    }
};
// 1. Identity Service Proxies
app.use((0, http_proxy_middleware_1.createProxyMiddleware)({
    ...proxyOptions,
    target: identityServiceUrl,
    pathFilter: (path) => path.startsWith('/api/v1/auth') || path.startsWith('/api/v1/users') || path.startsWith('/api/v1/roles')
}));
// 2. Content Service Proxies
app.use((0, http_proxy_middleware_1.createProxyMiddleware)({
    ...proxyOptions,
    target: contentServiceUrl,
    pathFilter: (path) => path.startsWith('/api/v1/destinations') ||
        path.startsWith('/api/v1/attractions') ||
        path.startsWith('/api/v1/cta') ||
        path.startsWith('/api/v1/admin/destinations') ||
        path.startsWith('/api/v1/admin/attractions') ||
        path.startsWith('/api/v1/admin/cta')
}));
// 3. Program Service Proxies
app.use((0, http_proxy_middleware_1.createProxyMiddleware)({
    ...proxyOptions,
    target: programServiceUrl,
    pathFilter: (path) => path.startsWith('/api/v1/programs') ||
        path.startsWith('/api/v1/admin/programs') ||
        path.startsWith('/api/v1/admin/providers') ||
        path.startsWith('/api/v1/categories') ||
        path.startsWith('/api/v1/admin/categories')
}));
// 4. Media Service Proxies (including static file uploads directory)
app.use((0, http_proxy_middleware_1.createProxyMiddleware)({
    ...proxyOptions,
    target: mediaServiceUrl,
    pathFilter: (path) => path.startsWith('/api/v1/media') ||
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
