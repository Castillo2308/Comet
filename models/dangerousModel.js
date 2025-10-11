import { neonClient } from '../lib/neonClient.js';

export async function listDangerous() {
  return await neonClient`select id, title, description, location, date, dangerlevel, author from dangerous_areas order by date desc`;
}

export async function createDangerous(d) {
  const rows = await neonClient`
    insert into dangerous_areas (title, description, location, date, dangerlevel, author)
    values (${d.title}, ${d.description}, ${d.location}, ${d.date}, ${d.dangerlevel}, ${d.author})
    returning id, title, description, location, date, dangerlevel, author
  `;
  return rows?.[0];
}

export async function updateDangerous(id, u) {
  const rows = await neonClient`
    update dangerous_areas set
      title = coalesce(${u.title}, title),
      description = coalesce(${u.description}, description),
      location = coalesce(${u.location}, location),
      date = coalesce(${u.date}, date),
      dangerlevel = coalesce(${u.dangerlevel}, dangerlevel)
    where id = ${id}
    returning id, title, description, location, date, dangerlevel, author
  `;
  return rows?.[0] || null;
}

export async function deleteDangerous(id) {
  const rows = await neonClient`delete from dangerous_areas where id=${id} returning id`;
  return rows?.length > 0;
}
