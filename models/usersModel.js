import { neonClient } from '../lib/neonClient.js';

export const createUser = async ({ name, lastname, cedula, email, password, role = 'user', verified = false }) => {
  // Pre-check duplicates for clear error messages
  const emailTrim = String(email || '').trim().toLowerCase();
  const existingByCedula = await neonClient`
    select cedula from users where cedula = ${cedula}
  `;
  if (existingByCedula?.length) return { success: false, duplicate: 'cedula' };
  const existingByEmail = await neonClient`
    select email from users where email = ${emailTrim}
  `;
  if (existingByEmail?.length) return { success: false, duplicate: 'email' };

  // Insert user
  await neonClient`
    insert into users (name, lastname, cedula, email, password, role, verified)
    values (${name}, ${lastname}, ${cedula}, ${emailTrim}, ${password}, ${role}, ${verified})
  `;
  return { success: true };
};

export const getUserByEmail = async (email) => {
  const rows = await neonClient`
    select name, lastname, cedula, email, password, role, verified
    from users
    where email = ${email.trim()}
  `;
  return rows?.[0] || null;
};

export const getUserByCedula = async (cedula) => {
  const rows = await neonClient`
    select name, lastname, cedula, email, role, password, verified
    from users where cedula = ${cedula}
  `;
  return rows?.[0] || null;
};

export const listUsers = async () => {
  const rows = await neonClient`
    select name, lastname, cedula, email, role, verified, created_at from users order by created_at desc
  `;
  return rows || [];
};

export const updateUser = async (cedula, updates) => {
  const { name, lastname, email, password, role, verified } = updates;
  const rows = await neonClient`
    update users
    set
      name = coalesce(${name}, name),
      lastname = coalesce(${lastname}, lastname),
      email = coalesce(${email}, email),
      password = coalesce(${password}, password),
      role = coalesce(${role}, role),
      verified = coalesce(${verified}, verified)
    where cedula = ${cedula}
    returning name, lastname, cedula, email, role, verified
  `;
  return rows?.[0] || null;
};

export const deleteUser = async (cedula) => {
  const rows = await neonClient`
    delete from users where cedula = ${cedula} returning cedula
  `;
  return rows?.length > 0;
};

export const deleteUserCascade = async (cedula) => {
  // Protect global admin account from deletion
  if (String(cedula) === '000000000') return false;
  // Delete dependent rows first to avoid FK violations
  await neonClient`delete from reports where author = ${cedula}`;
  await neonClient`delete from complaints where author = ${cedula}`;
  const rows = await neonClient`delete from users where cedula = ${cedula} returning cedula`;
  return rows?.length > 0;
};

export const updateUserRole = async (cedula, role) => {
  const rows = await neonClient`
    update users
    set role = ${role}
    where cedula = ${cedula}
    returning name, lastname, cedula, email, role, verified
  `;
  return rows?.[0] || null;
};

export const setUserVerifiedByEmail = async (email) => {
  const rows = await neonClient`
    update users set verified = true where email = ${email} returning cedula
  `;
  return rows?.length > 0;
};

export const insertVerifyToken = async ({ token, email, expiresAt }) => {
  await neonClient`
    insert into verification_tokens (token, email, expires_at) values (${token}, ${email}, ${expiresAt})
  `;
  return true;
};

export const consumeVerifyToken = async (token) => {
  const rows = await neonClient`
    delete from verification_tokens where token = ${token} and expires_at > now() returning email
  `;
  return rows?.[0]?.email || null;
};


