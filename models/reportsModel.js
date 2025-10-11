import { neonClient } from '../lib/neonClient.js';

export async function listReports() {
  return await neonClient`select id, type, title, description, location, date, status, photo_link, author from reports order by date desc`;
}

export async function createReport(rep) {
  const rows = await neonClient`
    insert into reports (type, title, description, location, date, status, photo_link, author)
    values (${rep.type}, ${rep.title}, ${rep.description}, ${rep.location}, ${rep.date}, ${rep.status ?? 'pending'}, ${rep.photo_link}, ${rep.author})
    returning id, type, title, description, location, date, status, photo_link, author
  `;
  return rows?.[0];
}

export async function updateReport(id, updates) {
  const rows = await neonClient`
    update reports set
      type = coalesce(${updates.type}, type),
      title = coalesce(${updates.title}, title),
      description = coalesce(${updates.description}, description),
      location = coalesce(${updates.location}, location),
      date = coalesce(${updates.date}, date),
      status = coalesce(${updates.status}, status),
      photo_link = coalesce(${updates.photo_link}, photo_link)
    where id = ${id}
    returning id, type, title, description, location, date, status, photo_link, author
  `;
  return rows?.[0] || null;
}

export async function deleteReport(id) {
  const rows = await neonClient`delete from reports where id=${id} returning id`;
  return rows?.length > 0;
}
