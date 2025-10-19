import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env.local only in development (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env.local') });
}

const sql = neon(process.env.NEON_DATABASE_URL);
export const neonClient = sql;