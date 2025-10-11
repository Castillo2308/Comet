import { listDangerous, createDangerous, updateDangerous, deleteDangerous } from '../models/dangerousModel.js';

export default {
  async list(_req, res) {
    try { res.json(await listDangerous()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list dangerous areas' }); }
  },
  async create(req, res) {
    try { res.status(201).json(await createDangerous(req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create record' }); }
  },
  async update(req, res) {
    try { const row = await updateDangerous(req.params.id, req.body); if (!row) return res.status(404).json({ message: 'Not found' }); res.json(row); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update record' }); }
  },
  async remove(req, res) {
    try { const ok = await deleteDangerous(req.params.id); if (!ok) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete record' }); }
  }
};
