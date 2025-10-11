import { listReports, createReport, updateReport, deleteReport } from '../models/reportsModel.js';

export default {
  async list(_req, res) {
    try { res.json(await listReports()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list reports' }); }
  },
  async create(req, res) {
    try { res.status(201).json(await createReport(req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create report' }); }
  },
  async update(req, res) {
    try { const row = await updateReport(req.params.id, req.body); if (!row) return res.status(404).json({ message: 'Report not found' }); res.json(row); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update report' }); }
  },
  async remove(req, res) {
    try { const ok = await deleteReport(req.params.id); if (!ok) return res.status(404).json({ message: 'Report not found' }); res.json({ message: 'Report deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete report' }); }
  }
};
