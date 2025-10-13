import { listEvents, createEvent, updateEvent, deleteEvent } from '../models/eventsModel.js';
import { isPrivileged } from '../lib/auth.js';

export async function getEvents(_req, res) {
  try {
    const rows = await listEvents();
    res.json(rows);
  } catch (e) {
    console.error('getEvents error', e);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
}

export async function postEvent(req, res) {
  try {
    const body = { ...req.body };
    if (!body.author && req.user?.cedula) body.author = req.user.cedula;
    const evt = await createEvent(body);
    res.status(201).json(evt);
  } catch (e) {
    console.error('postEvent error', e);
    res.status(500).json({ message: 'Failed to create event' });
  }
}

export async function putEvent(req, res) {
  try {
    const existing = await getEventById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Event not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(existing.author) === String(cedula));
    if (!can) return res.status(403).json({ message: 'Prohibido' });
    const updated = await updateEvent(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Event not found' });
    res.json(updated);
  } catch (e) {
    console.error('putEvent error', e);
    res.status(500).json({ message: 'Failed to update event' });
  }
}

export async function removeEvent(req, res) {
  try {
    const existing = await getEventById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Event not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(existing.author) === String(cedula));
    if (!can) return res.status(403).json({ message: 'Prohibido' });
    const ok = await deleteEvent(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (e) {
    console.error('removeEvent error', e);
    res.status(500).json({ message: 'Failed to delete event' });
  }
}

import { getEventById } from '../models/eventsModel.js';
export default { getEvents, postEvent, putEvent, removeEvent };
