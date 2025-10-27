import { listHotspots, createHotspot, listHotspotComments, addHotspotComment, deleteHotspot, updateHotspot, getHotspotById, getHotspotCommentById, deleteHotspotComment } from '../models/securityModel.js';
import { isPrivileged } from '../lib/auth.js';

export default {
  async list(_req, res) { try { res.json(await listHotspots()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list hotspots' }); } },
  async create(req, res) {
    try {
      const body = req.body || {};
      // Coerce and validate lat/lng from multiple possible properties
      const rawLat = body.lat ?? body.latitude;
      const rawLng = body.lng ?? body.longitude;
  const lat = rawLat !== undefined && rawLat !== null && rawLat !== '' ? Number(rawLat) : undefined;
  const lng = rawLng !== undefined && rawLng !== null && rawLng !== '' ? Number(rawLng) : undefined;
      const plusCode = body.plusCode ?? body.pluscode;
      if ((!Number.isFinite(lat) || !Number.isFinite(lng)) && !plusCode) {
        return res.status(400).json({ message: 'Se requiere lat/lng válidos o un plusCode' });
      }
      const payload = {
        title: body.title,
        description: body.description,
        date: body.date,
        dangertime: body.dangertime,
        dangerlevel: body.dangerlevel,
        author: req.user?.cedula || body.author,
        lat,
        lng,
        plusCode,
        placeId: body.placeId,
        address: body.address,
      };
      const created = await createHotspot(payload);
      return res.status(201).json(created);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create hotspot' }); }
  },
  async comments(req, res) { try { res.json(await listHotspotComments(req.params.id)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list comments' }); } },
  async addComment(req, res) {
    try {
      const body = req.body || {};
      const created = await addHotspotComment(req.params.id, { ...body, author: req.user?.cedula || body.author });
      res.status(201).json(created);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to add comment' }); }
  },
  async deleteComment(req, res) {
    try {
      const cid = req.params.commentId;
      const c = await getHotspotCommentById(cid);
      if (!c) return res.status(404).json({ message: 'Not found' });
      const role = req.user?.role;
      const cedula = req.user?.cedula;
      const can = isPrivileged(role) || (cedula && String(c.author) === String(cedula));
      if (!can) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteHotspotComment(cid);
      if (!ok) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete comment' }); }
  },
  async remove(req, res) {
    try {
      const doc = await getHotspotById(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
  const role = req.user?.role;
      const cedula = req.user?.cedula;
  const canDelete = isPrivileged(role) || (cedula && String(doc.author) === String(cedula));
      if (!canDelete) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteHotspot(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete hotspot' }); }
  },
  async update(req, res) {
    try {
      const doc = await getHotspotById(req.params.id);
      if (!doc) return res.status(404).json({ message: 'Not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(doc.author) === String(cedula));
      if (!can) return res.status(403).json({ message: 'Prohibido' });
      const row = await updateHotspot(req.params.id, req.body);
      if (!row) return res.status(404).json({ message: 'Not found' });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update hotspot' }); }
  },
};
