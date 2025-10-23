import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env.local only in development (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env.local') });
}

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
import { migrateRouteColors } from '../lib/migrateRoutColors.js';

const app = express();
// When behind a proxy (Vercel/Render/NGINX), enable trust proxy for correct IPs in rate limiters
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// Run migration on first request (ensures it happens once per container)
let migrationDone = false;

// Middleware to run migration once
app.use(async (_req, _res, next) => {
  if (!migrationDone) {
    migrationDone = true;
    await migrateRouteColors();
  }
  next();
});

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled to avoid blocking in dev; enable with allowlist if needed
  crossOriginEmbedderPolicy: false, // Allow cross-origin resources to be loaded by the frontend
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permit images/scripts from other origins (e.g., Google Drive)
}));

// CORS: allow configured origins (supports exact hosts and wildcard subdomains like *.vercel.app)
// Example CORS_ORIGINS: "https://your-app.vercel.app, https://*.vercel.app, http://localhost:5173"
const rawOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

function parseHost(v) {
  try { return new URL(v).hostname; } catch { return v.replace(/^https?:\/\//, ''); }
}

const exactHosts = [];
const suffixHosts = [];
for (const o of rawOrigins) {
  const v = o.toLowerCase();
  if (v.startsWith('*.') || v.startsWith('.')) {
    const suffix = v.replace(/^[*.]+/, '');
    if (suffix) suffixHosts.push(suffix);
  } else {
    const host = parseHost(v);
    if (host) exactHosts.push(host);
  }
}

function isAllowedOrigin(origin) {
  if (!origin) return true; // non-browser or same-origin
  
  let host = '';
  try { host = new URL(origin).hostname.toLowerCase(); }
  catch { host = parseHost(origin).toLowerCase(); }
  if (!host) return false;
  
  // If on Vercel, allow all Vercel subdomains by default
  if (host.endsWith('.vercel.app')) {
    console.log(`CORS allowed: ${origin}`);
    return true;
  }
  
  // If localhost, always allow (development)
  if (host === 'localhost' || host.startsWith('127.')) {
    return true;
  }
  
  if (rawOrigins.length === 0) return true; // permissive if not configured
  
  if (exactHosts.includes(host)) return true;
  for (const sfx of suffixHosts) {
    if (host === sfx || host.endsWith('.' + sfx)) return true;
  }
  
  console.warn(`CORS rejected: ${origin}`);
  return false;
}

app.use(cors({
  origin: function (origin, callback) {
    const allowed = isAllowedOrigin(origin || '');
    callback(allowed ? null : new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Explicit CORS headers for Vercel
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all Vercel subdomains
  if (origin && origin.includes('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  } else if (origin === 'http://localhost:3000' || origin === 'http://localhost:5173') {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
  
  next();
});

// Handle preflight without defining a route pattern (prevents path-to-regexp issues)
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // CORS headers already set above
    return res.sendStatus(204);
  }
  next();
});

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

// Initialize SQL schema only once at startup
let schemaInitialized = false;
let schemaInitPromise = null;

async function initSchemaOnce() {
  if (schemaInitialized) return;
  if (!schemaInitPromise) {
    schemaInitPromise = ensureSchema().then(() => {
      schemaInitialized = true;
      console.log('Database schema initialized successfully');
    }).catch((err) => {
      console.error('Failed to initialize schema:', err);
      throw err;
    });
  }
  return schemaInitPromise;
}

// Add middleware to initialize schema once on first API request
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    try {
      await initSchemaOnce();
    } catch (err) {
      console.error('Schema init error on request:', err.message);
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  }
  next();
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

// Local development: Start server if not on Vercel/serverless
if (process.env.VERCEL !== '1' && !process.env.LAMBDA_TASK_ROOT) {
  const PORT = Number(process.env.PORT || 5000);
  const server = app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Export app for both local server and Vercel serverless
export default app;
