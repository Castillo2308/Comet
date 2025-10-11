import { listHotspots, createHotspot, listHotspotComments, addHotspotComment, deleteHotspot, updateHotspot } from '../models/securityModel.js';

export default {
  async list(_req, res) { try { res.json(await listHotspots()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list hotspots' }); } },
  async create(req, res) { try { res.status(201).json(await createHotspot(req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create hotspot' }); } },
  async comments(req, res) { try { res.json(await listHotspotComments(req.params.id)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list comments' }); } },
  async addComment(req, res) { try { res.status(201).json(await addHotspotComment(req.params.id, req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to add comment' }); } },
  async remove(req, res) { try { const ok = await deleteHotspot(req.params.id); if (!ok) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete hotspot' }); } },
  async update(req, res) { try { const row = await updateHotspot(req.params.id, req.body); if (!row) return res.status(404).json({ message: 'Not found' }); res.json(row); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update hotspot' }); } },
};
