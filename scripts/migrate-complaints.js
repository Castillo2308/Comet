import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const sql = neon(process.env.NEON_DATABASE_URL);

async function migrate() {
  try {
    console.log('Starting complaints table migration...');
    
    // Drop the foreign key constraint if it exists
    console.log('Dropping foreign key constraint...');
    await sql`ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_author_fkey`;
    
    // Alter column type
    console.log('Altering author column type to varchar(100)...');
    await sql`ALTER TABLE complaints ALTER COLUMN author TYPE varchar(100)`;
    
    console.log('✅ Migration complete! Complaints table updated successfully.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration failed:', e.message);
    process.exit(1);
  }
}

migrate();
