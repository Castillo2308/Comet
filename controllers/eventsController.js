import { listEvents, createEvent, updateEvent, deleteEvent } from '../models/eventsModel.js';

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
    const evt = await createEvent(req.body);
    res.status(201).json(evt);
  } catch (e) {
    console.error('postEvent error', e);
    res.status(500).json({ message: 'Failed to create event' });
  }
}

export async function putEvent(req, res) {
  try {
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
    const ok = await deleteEvent(req.params.id);
    if (!ok) return res.status(404).json({ message: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (e) {
    console.error('removeEvent error', e);
    res.status(500).json({ message: 'Failed to delete event' });
  }
}

export default { getEvents, postEvent, putEvent, removeEvent };
