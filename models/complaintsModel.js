import { neonClient } from '../lib/neonClient.js';

export async function listComplaints() {
  return await neonClient`select id, type, title, description, location, date, status, author from complaints order by date desc`;
}

export async function createComplaint(c) {
  const rows = await neonClient`
    insert into complaints (type, title, description, location, date, status, author)
    values (${c.type}, ${c.title}, ${c.description}, ${c.location}, ${c.date}, ${c.status ?? 'Pendiente'}, ${c.author})
    returning id, type, title, description, location, date, status, author
  `;
  return rows?.[0];
}

export async function updateComplaint(id, u) {
  const rows = await neonClient`
    update complaints set
      type = coalesce(${u.type}, type),
      title = coalesce(${u.title}, title),
      description = coalesce(${u.description}, description),
      location = coalesce(${u.location}, location),
      date = coalesce(${u.date}, date),
      status = coalesce(${u.status}, status)
    where id = ${id}
    returning id, type, title, description, location, date, status, author
  `;
  return rows?.[0] || null;
}

export async function deleteComplaint(id) {
  const rows = await neonClient`delete from complaints where id=${id} returning id`;
  return rows?.length > 0;
}
