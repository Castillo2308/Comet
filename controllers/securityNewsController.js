import { listSecurityNews, createSecurityNews, updateSecurityNews, deleteSecurityNews } from '../models/securityNewsModel.js';

export default {
  async list(_req, res) {
    try { res.json(await listSecurityNews()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list security news' }); }
  },
  async create(req, res) {
    try { res.status(201).json(await createSecurityNews(req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create security news' }); }
  },
  async update(req, res) {
    try { const row = await updateSecurityNews(req.params.id, req.body); if (!row) return res.status(404).json({ message: 'Not found' }); res.json(row); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update security news' }); }
  },
  async remove(req, res) {
    try { const ok = await deleteSecurityNews(req.params.id); if (!ok) return res.status(404).json({ message: 'Not found' }); res.json({ message: 'Deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete security news' }); }
  }
};
