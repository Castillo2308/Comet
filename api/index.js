import 'dotenv/config';
import express from 'express';
import serverless from 'serverless-http';
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
app.use(express.json({ limit: '10mb' }));

// Initialize SQL schema at startup (idempotent)
ensureSchema().catch((e) => console.error('Schema init error', e));

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
