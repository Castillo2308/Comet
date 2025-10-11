import { neonClient } from '../lib/neonClient.js';

export async function listNews() {
  // Return urgent first (insurgent=true), then by newest date
  return await neonClient`select id, type, title, description, insurgent, date, author from news order by insurgent desc, date desc`;
}

export async function createNews(n) {
  const rows = await neonClient`
    insert into news (type, title, description, insurgent, date, author)
    values (${n.type}, ${n.title}, ${n.description}, ${n.insurgent ?? false}, ${n.date}, ${n.author})
    returning id, type, title, description, insurgent, date, author
  `;
  return rows?.[0];
}

export async function updateNews(id, u) {
  const rows = await neonClient`
    update news set
      type = coalesce(${u.type}, type),
      title = coalesce(${u.title}, title),
      description = coalesce(${u.description}, description),
      insurgent = coalesce(${u.insurgent}, insurgent),
      date = coalesce(${u.date}, date)
    where id = ${id}
    returning id, type, title, description, insurgent, date, author
  `;
  return rows?.[0] || null;
}

export async function deleteNews(id) {
  const rows = await neonClient`delete from news where id=${id} returning id`;
  return rows?.length > 0;
}
