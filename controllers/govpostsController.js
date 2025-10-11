import { listNews, createNews, updateNews, deleteNews } from '../models/newsModel.js';

export default {
  async list(_req, res) {
    try { res.json(await listNews()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list news' }); }
  },
  async create(req, res) {
    try { res.status(201).json(await createNews(req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create news' }); }
  },
  async update(req, res) {
    try {
      const row = await updateNews(req.params.id, req.body);
      if (!row) return res.status(404).json({ message: 'News not found' });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update news' }); }
  },
  async remove(req, res) {
    try { const ok = await deleteNews(req.params.id); if (!ok) return res.status(404).json({ message: 'News not found' }); res.json({ message: 'News deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete news' }); }
  }
};
