import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import usersRoutes from '../routes/usersRoutes.js';
import { requireAuth } from '../lib/auth.js';
import eventsRoutes from '../routes/eventsRoutes.js';
import newsRoutes from '../routes/govpostsRoutes.js';
import reportsRoutes from '../routes/reportsRoutes.js';
import dangerousRoutes from '../routes/dangerousRoutes.js';
import securityRoutes from '../routes/securityRoutes.js';
import securityNewsRoutes from '../routes/securityNewsRoutes.js';
import forumRoutes from '../routes/userpostsRoutes.js';
import commentsRoutes from '../routes/commentsRoutes.js';
import complaintsRoutes from '../routes/complaintsRoutes.js';
import busesRoutes from '../routes/busesRoutes.js';
import uploadsRoutes from '../routes/uploadsRoutes.js';
import { ensureSchema } from '../lib/initSql.js';

const app = express();
// When behind a proxy (Vercel/Render/NGINX), enable trust proxy for correct IPs in rate limiters
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to avoid blocking in dev; enable with allowlist if needed
  crossOriginEmbedderPolicy: false, // Allow cross-origin resources to be loaded by the frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permit images/scripts from other origins (e.g., Google Drive)
}));

// CORS: allow configured origins; default to allow same-origin/non-browser
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0) return callback(null, true);
    const allowed = allowedOrigins.includes(origin);
    callback(allowed ? null : new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Basic rate limiting
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Be more permissive in dev to reduce friction; stricter in prod
  limit: process.env.NODE_ENV === 'development' ? 100 : 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Don't count successful logins against the limit
  skipSuccessfulRequests: true,
  // Scope attempts per IP + email to avoid one-IP (dev proxy) exhausting everyone
  keyGenerator: (req, _res) => `${req.ip}|${(req.body && req.body.email) || 'unknown'}`,
});

// Apply rate limiters to selected paths
app.use('/api/users/login', authLimiter);
app.use('/api/users', sensitiveLimiter);
app.use('/api/reports', sensitiveLimiter);
app.use('/api/complaints', sensitiveLimiter);

app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dangerous-areas', dangerousRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/security-news', securityNewsRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/uploads', uploadsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/auth/whoami', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Debug middleware - log unmatched routes (must be AFTER all other routes)
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    console.log(`Unmatched route: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Initialize SQL schema before starting server
ensureSchema()
  .then(() => {
    const PORT = Number(process.env.PORT || 5000);
    const server = app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`);
    });

    // Prevent the server from closing unexpectedly
    server.on('error', (err) => {
      console.error('Server error:', err);
    });
  })
  .catch((e) => {
    console.error('Schema init error', e);
    process.exit(1);
  });

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// For local testing, just export the app if needed
export default app;
