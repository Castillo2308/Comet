import { neonClient } from '../lib/neonClient.js';

export const createUser = async ({ name, lastname, cedula, email, password, role = 'user' }) => {
  await neonClient`
    insert into users (name, lastname, cedula, email, password, role)
    values (${name}, ${lastname}, ${cedula}, ${email}, ${password}, ${role})
    on conflict (cedula) do nothing
  `;
  return { success: true };
};

export const getUserByEmail = async (email) => {
  const rows = await neonClient`
    select name, lastname, cedula, email, password, role
    from users
    where email = ${email.trim()}
  `;
  return rows?.[0] || null;
};

export const getUserByCedula = async (cedula) => {
  const rows = await neonClient`
    select name, lastname, cedula, email, role
    from users where cedula = ${cedula}
  `;
  return rows?.[0] || null;
};

export const listUsers = async () => {
  const rows = await neonClient`
    select name, lastname, cedula, email, role, created_at from users order by created_at desc
  `;
  return rows || [];
};

export const updateUser = async (cedula, updates) => {
  const { name, lastname, email, password, role } = updates;
  const rows = await neonClient`
    update users
    set
      name = coalesce(${name}, name),
      lastname = coalesce(${lastname}, lastname),
      email = coalesce(${email}, email),
      password = coalesce(${password}, password),
      role = coalesce(${role}, role)
    where cedula = ${cedula}
    returning name, lastname, cedula, email, role
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
  // Delete dependent rows first to avoid FK violations
  await neonClient`delete from reports where author = ${cedula}`;
  await neonClient`delete from complaints where author = ${cedula}`;
  const rows = await neonClient`delete from users where cedula = ${cedula} returning cedula`;
  return rows?.length > 0;
};


