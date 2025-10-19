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

export async function ensureSchema() {
  // Create tables if they don't exist based on the ERD provided (subset we use today)
  await sql`
    create table if not exists users (
      cedula varchar(12) primary key,
      name varchar(50) not null,
      lastname varchar(50) not null,
      email varchar(100) unique not null,
      password text not null,
      role varchar(20) not null default 'user',
      verified boolean not null default false,
      created_at timestamp default now()
    );
  `;

  // Ensure role column exists for existing deployments
  await sql`alter table users add column if not exists role varchar(20) not null default 'user';`;
  await sql`alter table users add column if not exists verified boolean not null default false;`;

  // Verification tokens table
  await sql`
    create table if not exists verification_tokens (
      token varchar(64) primary key,
      email varchar(100) not null,
      created_at timestamp default now(),
      expires_at timestamp not null
    );
  `;

  await sql`
    create table if not exists news (
      id serial primary key,
      type varchar(50),
      title varchar(200) not null,
      description text,
      insurgent boolean default false,
      date timestamp default now(),
      author varchar(50)
    );
  `;

  // Security news: distinct stream for safety announcements
  await sql`
    create table if not exists security_news (
      id serial primary key,
      type varchar(50),
      title varchar(200) not null,
      description text,
      insurgent boolean default false,
      date timestamp default now(),
      author varchar(50)
    );
  `;

  await sql`
    create table if not exists reports (
      id serial primary key,
      type varchar(50),
      title varchar(200) not null,
      description text,
      location varchar(200),
      date timestamp default now(),
      status varchar(20) default 'pending',
      photo_link varchar(500),
      author varchar(12) references users(cedula)
    );
  `;

  await sql`
    create table if not exists events (
      id serial primary key,
      type varchar(50),
      title varchar(200) not null,
      description text,
      date timestamp not null,
      location varchar(200),
      attendants varchar(20),
      host varchar(100),
      price int,
      author varchar(50)
    );
  `;

  await sql`
    create table if not exists dangerous_areas (
      id serial primary key,
      title varchar(200) not null,
      description text,
      location varchar(200),
      date timestamp default now(),
      dangerlevel varchar(10),
      author varchar(50)
    );
  `;

  // Complaints are distinct from reports; security/violence related
  await sql`
    create table if not exists complaints (
      id serial primary key,
      type varchar(50),
      title varchar(200) not null,
      description text,
      location varchar(200),
      date timestamp default now(),
      status varchar(20) default 'pending',
      author varchar(12) references users(cedula)
    );
  `;
}
