"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = require("express-rate-limit");
const http_proxy_middleware_1 = require("http-proxy-middleware");
const db_js_1 = require("./db.js");
const auth_middleware_js_1 = require("./middlewares/auth.middleware.js");
const audit_middleware_js_1 = require("./middlewares/audit.middleware.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 7009;
const identityServiceUrl = process.env.IDENTITY_SERVICE_URL || 'http://localhost:7010';
const contentServiceUrl = process.env.CONTENT_SERVICE_URL || 'http://localhost:7011';
const programServiceUrl = process.env.PROGRAM_SERVICE_URL || 'http://localhost:7012';
const mediaServiceUrl = process.env.MEDIA_SERVICE_URL || 'http://localhost:7013';
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
// Apply rate limiting to login endpoint
app.use('/api/v1/auth/login', apiLimiter);
// JWT & Route Protection Middlewares
app.use(auth_middleware_js_1.authMiddleware);
app.use(auth_middleware_js_1.protectAdminRoutes);
// Audit Logging Middleware for write/mutation endpoints
app.use(audit_middleware_js_1.auditLoggingMiddleware);
// Proxy Routes Configuration
const proxyOptions = {
    changeOrigin: true,
    on: {
        proxyReq: (proxyReq, req) => {
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
    pathFilter: (path) => path.startsWith('/api/v1/auth') ||
        path.startsWith('/api/v1/users') ||
        path.startsWith('/api/v1/roles') ||
        path.startsWith('/api/v1/billing') ||
        path.startsWith('/api/v1/notifications') ||
        path.startsWith('/api/v1/payout')
}));
// 2. Content Service Proxies
app.use((0, http_proxy_middleware_1.createProxyMiddleware)({
    ...proxyOptions,
    target: contentServiceUrl,
    pathFilter: (path) => path.startsWith('/api/v1/destinations') ||
        path.startsWith('/api/v1/attractions') ||
        path.startsWith('/api/v1/cta') ||
        path.startsWith('/api/v1/app-config') ||
        path.startsWith('/api/v1/admin/destinations') ||
        path.startsWith('/api/v1/admin/attractions') ||
        path.startsWith('/api/v1/admin/cta') ||
        path.startsWith('/api/v1/admin/app-config')
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
(0, db_js_1.initDb)().then(() => {
    app.listen(port, () => {
        console.log(`API Gateway running on port ${port}`);
    });
});
exports.default = app;
