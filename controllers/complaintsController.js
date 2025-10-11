import { listComplaints, createComplaint, updateComplaint, deleteComplaint } from '../models/complaintsModel.js';

export default {
  async list(_req, res) {
    try { res.json(await listComplaints()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list complaints' }); }
  },
  async create(req, res) {
    try { res.status(201).json(await createComplaint(req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create complaint' }); }
  },
  async update(req, res) {
    try { const row = await updateComplaint(req.params.id, req.body); if (!row) return res.status(404).json({ message: 'Complaint not found' }); res.json(row); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update complaint' }); }
  },
  async remove(req, res) {
    try { const ok = await deleteComplaint(req.params.id); if (!ok) return res.status(404).json({ message: 'Complaint not found' }); res.json({ message: 'Complaint deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete complaint' }); }
  }
};
