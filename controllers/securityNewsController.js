import { listSecurityNews, createSecurityNews, updateSecurityNews, deleteSecurityNews, getSecurityNewsById } from '../models/securityNewsModel.js';
import { isPrivileged } from '../lib/auth.js';

export default {
  async list(_req, res) {
    try { res.json(await listSecurityNews()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list security news' }); }
  },
  async create(req, res) {
    try {
      const body = { ...req.body };
      if (!body.author && req.user?.cedula) body.author = req.user.cedula;
      res.status(201).json(await createSecurityNews(body));
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create security news' }); }
  },
  async update(req, res) {
    try {
      const existing = await getSecurityNewsById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(existing.author) === String(cedula));
      if (!can) return res.status(403).json({ message: 'Prohibido' });
      const row = await updateSecurityNews(req.params.id, req.body);
      if (!row) return res.status(404).json({ message: 'Not found' });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update security news' }); }
  },
  async remove(req, res) {
    try {
      const existing = await getSecurityNewsById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(existing.author) === String(cedula));
      if (!can) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteSecurityNews(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete security news' }); }
  }
};
