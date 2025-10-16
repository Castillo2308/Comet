import { createBusApplication, listBuses, listActiveBuses, getBusById, updateBus, deleteBus, startServiceByDriver, stopServiceByDriver, updateLocationByDriver, approveBus, rejectBus, findApplicationForUser } from '../models/busesModel.js';
import { updateUserRole } from '../models/usersModel.js';
import { isPrivileged } from '../lib/auth.js';
import { ObjectId } from '../lib/mongoClient.js';

export default {
  // Public: list active buses for user map
  async listActive(_req, res) {
    try { res.json(await listActiveBuses()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list active buses' }); }
  },
  // Admin: list all buses
  async listAll(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      res.json(await listBuses());
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list buses' }); }
  },
  // User: get my application
  async mine(req, res) {
    try {
      const { cedula } = req.body || {};
      if (!cedula) return res.status(401).json({ message: 'Unauthorized' });
      const app = await findApplicationForUser(cedula);
      res.json(app || null);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to get application' }); }
  },
  // User: apply to be driver
  async apply(req, res) {
    try {
      const { cedula, ...body } = req.body || {};
      if (!cedula) return res.status(401).json({ message: 'Unauthorized' });
      const created = await createBusApplication({ ...body, driverCedula: cedula });
      res.status(201).json(created);
    } catch (e) { 
      console.error(e);
      const msg = e.message || 'Failed to submit application';
      res.status(400).json({ message: msg });
    }
  },
  // Admin approve: promote user to driver and approve bus application
  async approve(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const busId = req.params.id;
      const bus = await getBusById(busId);
      if (!bus) return res.status(404).json({ message: 'Bus application not found' });
      if (bus.status !== 'pending') return res.status(400).json({ message: 'Application is not pending' });
      
      // Approve the bus application
      const updated = await approveBus(busId);
      if (!updated) return res.status(500).json({ message: 'Failed to approve application' });
      
      // Promote user to driver role
      console.log(`Promoting user ${bus.driverCedula} to driver role...`);
      const userUpdated = await updateUserRole(bus.driverCedula, 'driver');
      if (!userUpdated) {
        console.error(`ERROR: Failed to update user role for ${bus.driverCedula}`);
      } else {
        console.log(`SUCCESS: User ${bus.driverCedula} promoted to driver. New role: ${userUpdated.role}`);
      }
      
      res.json({ message: 'Approved', bus: updated, userPromoted: !!userUpdated });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to approve bus' }); }
  },
  async reject(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const busId = req.params.id;
      const updated = await rejectBus(busId);
      if (!updated) return res.status(404).json({ message: 'Application not found or already processed' });
      res.json({ message: 'Rejected', bus: updated });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to reject application' }); }
  },
  async remove(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteBus(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete bus' }); }
  },
  // Admin update (full access to all fields)
  async adminUpdate(req, res) {
    try {
      const role = req.user?.role;
      if (!(isPrivileged(role) || role === 'buses')) return res.status(403).json({ message: 'Prohibido' });
      const id = req.params.id;
      const body = req.body || {};
      const updated = await updateBus(id, body);
      if (!updated) return res.status(404).json({ message: 'Not found' });
      res.json(updated);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update bus' }); }
  },
  // GET /buses/:id -> get bus by MongoDB ObjectId
  async getById(req, res) {
    try {
      const id = req.params.id;
      const bus = await getBusById(id);
      if (!bus) return res.status(404).json({ message: 'Not found' });
      res.json(bus);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to get bus' }); }
  },
  // Driver: start service with initial location
  async startService(req, res) {
    try {
      console.log('[busesController.startService] body:', req.body);
      const { cedula, lat, lng } = req.body || {};
      if (!cedula) return res.status(400).json({ message: 'Cedula is required' });
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ message: 'Location (lat, lng) required' });
      }
      const updated = await startServiceByDriver(cedula, lat, lng);
      console.log('[busesController.startService] model returned:', updated);
      if (!updated) {
        return res.status(404).json({ message: 'No approved bus application found for this driver' });
      }
      res.json(updated);
    } catch (e) { 
      console.error('[startService] Error:', e); 
      res.status(500).json({ message: 'Failed to start service' }); 
    }
  },
  // Driver: stop service
  async stopService(req, res) {
    try {
      console.log('[busesController.stopService] body:', req.body);
      const { cedula } = req.body || {};
      if (!cedula) return res.status(400).json({ message: 'Cedula is required' });
      const updated = await stopServiceByDriver(cedula);
      console.log('[busesController.stopService] model returned:', updated);
      if (!updated) {
        return res.status(404).json({ message: 'No active service found for this driver to stop' });
      }
      res.json(updated);
    } catch (e) { 
      console.error('[stopService] Error:', e); 
      res.status(500).json({ message: 'Failed to stop service' }); 
    }
  },
  // Driver: update location (ping)
  async ping(req, res) {
    try {
      console.log('[busesController.ping] body:', req.body);
      const { cedula, lat, lng } = req.body || {};
      if (!cedula) return res.status(400).json({ message: 'Cedula is required' });
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({ message: 'Location (lat, lng) required' });
      }
      const updated = await updateLocationByDriver(cedula, lat, lng);
      console.log('[busesController.ping] model returned:', updated);
      if (!updated) {
        return res.status(404).json({ message: 'No active service found for this driver to ping' });
      }
      res.json(updated);
    } catch (e) { 
      console.error('[ping] Error:', e); 
      res.status(500).json({ message: 'Failed to update location' }); 
    }
  },
};
