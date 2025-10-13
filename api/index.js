import 'dotenv/config';
import express from 'express';
import serverless from 'serverless-http';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import usersRoutes from '../routes/usersRoutes.js';
import eventsRoutes from '../routes/eventsRoutes.js';
import newsRoutes from '../routes/govpostsRoutes.js';
import reportsRoutes from '../routes/reportsRoutes.js';
import dangerousRoutes from '../routes/dangerousRoutes.js';
import securityRoutes from '../routes/securityRoutes.js';
import securityNewsRoutes from '../routes/securityNewsRoutes.js';
import forumRoutes from '../routes/userpostsRoutes.js';
import commentsRoutes from '../routes/commentsRoutes.js';
import complaintsRoutes from '../routes/complaintsRoutes.js';
import { ensureSchema } from '../lib/initSql.js';

const app = express();
// When behind a proxy (Vercel/Render/NGINX), enable trust proxy for correct IPs in rate limiters
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP by default to avoid blocking dev; enable later with allowlist
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
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Initialize SQL schema at startup (idempotent)
ensureSchema().catch((e) => console.error('Schema init error', e));

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

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});

export default serverless(app);
