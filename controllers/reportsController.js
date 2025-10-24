import { listReports, createReport, updateReport, deleteReport, getReportById } from '../models/reportsModel.js';
import { extractDriveFileId, deleteFromDrive } from '../lib/drive.js';
import { isPrivileged } from '../lib/auth.js';

export default {
  async list(_req, res) {
    try { res.json(await listReports()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list reports' }); }
  },
  async create(req, res) {
    try {
      const body = { ...req.body };
      if (!body.author && req.user?.cedula) body.author = req.user.cedula;
      const created = await createReport(body);
      res.status(201).json(created);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create report' }); }
  },
  async update(req, res) {
    try {
      const existing = await getReportById(req.params.id);
      if (!existing) return res.status(404).json({ message: 'Report not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const can = isPrivileged(role) || (cedula && String(existing.author) === String(cedula));
      if (!can) return res.status(403).json({ message: 'Prohibido' });
      const row = await updateReport(req.params.id, req.body);
      if (!row) return res.status(404).json({ message: 'Report not found' });
      res.json(row);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update report' }); }
  },
  async remove(req, res) {
    try {
      const rep = await getReportById(req.params.id);
      if (!rep) return res.status(404).json({ message: 'Report not found' });
  const role = req.user?.role; const cedula = req.user?.cedula;
  const canDelete = isPrivileged(role) || (cedula && String(rep.author) === String(cedula));
      if (!canDelete) return res.status(403).json({ message: 'Prohibido' });
      // Try deleting the linked Drive file (best effort)
      try {
        const id = extractDriveFileId(rep.photo_link);
        if (id) await deleteFromDrive(id);
      } catch {}
      const ok = await deleteReport(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Report not found' });
      res.json({ message: 'Report deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete report' }); }
  }
};
