import { neonClient } from '../lib/neonClient.js';

export async function listEvents() {
  return await neonClient`select id, type, title, description, date, location, attendants, host, price, author from events order by date desc`;
}

export async function createEvent(evt) {
  const rows = await neonClient`
    insert into events (type, title, description, date, location, attendants, host, price, author)
    values (${evt.type}, ${evt.title}, ${evt.description}, ${evt.date}, ${evt.location}, ${evt.attendants}, ${evt.host}, ${evt.price}, ${evt.author})
    returning id, type, title, description, date, location, attendants, host, price, author
  `;
  return rows?.[0];
}

export async function updateEvent(id, updates) {
  const rows = await neonClient`
    update events set
      type = coalesce(${updates.type}, type),
      title = coalesce(${updates.title}, title),
      description = coalesce(${updates.description}, description),
      date = coalesce(${updates.date}, date),
      location = coalesce(${updates.location}, location),
      attendants = coalesce(${updates.attendants}, attendants),
      host = coalesce(${updates.host}, host),
      price = coalesce(${updates.price}, price)
    where id = ${id}
    returning id, type, title, description, date, location, attendants, host, price, author
  `;
  return rows?.[0] || null;
}

export async function deleteEvent(id) {
  const rows = await neonClient`delete from events where id = ${id} returning id`;
  return rows?.length > 0;
}
