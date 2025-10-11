import { neonClient } from '../lib/neonClient.js';

export async function listSecurityNews() {
  return await neonClient`select id, type, title, description, insurgent, date, author from security_news order by insurgent desc, date desc`;
}

export async function createSecurityNews(n) {
  const rows = await neonClient`
    insert into security_news (type, title, description, insurgent, date, author)
    values (${n.type}, ${n.title}, ${n.description}, ${!!n.insurgent}, ${n.date || new Date().toISOString()}, ${n.author})
    returning id, type, title, description, insurgent, date, author
  `;
  return rows?.[0];
}

export async function updateSecurityNews(id, u) {
  const rows = await neonClient`
    update security_news set
      type = coalesce(${u.type}, type),
      title = coalesce(${u.title}, title),
      description = coalesce(${u.description}, description),
      insurgent = coalesce(${u.insurgent}, insurgent),
      date = coalesce(${u.date}, date),
      author = coalesce(${u.author}, author)
    where id = ${id}
    returning id, type, title, description, insurgent, date, author
  `;
  return rows?.[0] || null;
}

export async function deleteSecurityNews(id) {
  const rows = await neonClient`delete from security_news where id=${id} returning id`;
  return rows?.length > 0;
}
