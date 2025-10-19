import { listNews, createNews, updateNews, deleteNews, getNewsById } from '../models/newsModel.js';
import { isPrivileged } from '../lib/auth.js';

export default {
  async list(_req, res) {
    try { res.json(await listNews()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list news' }); }
  },
  async create(req, res) {
    try {
      const body = { ...req.body };
      if (!body.author && req.user?.cedula) body.author = req.user.cedula;
      res.status(201).json(await createNews(body));
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create news' }); }
  },
  async update(req, res) {
    try {
      const existing = await getNewsById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'News not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(existing.author) === String(cedula));
      if (!can) return res.status(403).json({ message: 'Prohibido' });
      const row = await updateNews(req.params.id, req.body);
      if (!row) return res.status(404).json({ message: 'News not found' });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update news' }); }
  },
  async remove(req, res) {
    try {
      const existing = await getNewsById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'News not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(existing.author) === String(cedula));
      if (!can) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteNews(req.params.id);
      if (!ok) return res.status(404).json({ message: 'News not found' });
      res.json({ message: 'News deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete news' }); }
  }
};
