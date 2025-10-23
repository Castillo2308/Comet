import express from 'express';
import busesController from '../controllers/busesController.js';
import { requireAuth, requireRole } from '../lib/auth.js';

const router = express.Router();

// Public: active buses for user map
router.get('/active', requireAuth, busesController.listActive);

// User: my application status
router.post('/mine', requireAuth, busesController.mine);

// User: apply to be driver
router.post('/apply', requireAuth, busesController.apply);

// Admin/buses: list all applications and manage them
router.get('/', requireAuth, requireRole('admin','buses'), busesController.listAll);
router.get('/:id', requireAuth, requireRole('admin','buses'), busesController.getById);
router.post('/:id/approve', requireAuth, requireRole('admin','buses'), busesController.approve);
router.post('/:id/reject', requireAuth, requireRole('admin','buses'), busesController.reject);
router.put('/:id', requireAuth, requireRole('admin','buses'), busesController.adminUpdate);
router.delete('/:id', requireAuth, requireRole('admin','buses'), busesController.remove);

// Driver operations (requires approved bus application)
router.post('/driver/start', requireAuth, busesController.startService);
router.post('/driver/stop', requireAuth, busesController.stopService);
router.post('/driver/ping', requireAuth, busesController.ping);
router.post('/driver/status', requireAuth, busesController.checkServiceStatus);

export default router;
