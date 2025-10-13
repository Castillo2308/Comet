import { listComplaints, createComplaint, updateComplaint, deleteComplaint, getComplaintById } from '../models/complaintsModel.js';
import { isPrivileged } from '../lib/auth.js';

export default {
  async list(_req, res) {
    try { res.json(await listComplaints()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list complaints' }); }
  },
  async create(req, res) {
    try {
      const body = { ...req.body };
    if (!body.author && req.user?.cedula) body.author = req.user.cedula;
      res.status(201).json(await createComplaint(body));
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create complaint' }); }
  },
  async update(req, res) {
    try { const row = await updateComplaint(req.params.id, req.body); if (!row) return res.status(404).json({ message: 'Complaint not found' }); res.json(row); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update complaint' }); }
  },
  async remove(req, res) {
    try {
      const row = await getComplaintById(req.params.id);
      if (!row) return res.status(404).json({ message: 'Complaint not found' });
    const role = req.user?.role; const cedula = req.user?.cedula;
    const canDelete = isPrivileged(role) || (cedula && String(row.author) === String(cedula));
      if (!canDelete) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteComplaint(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Complaint not found' });
      res.json({ message: 'Complaint deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete complaint' }); }
  }
};
