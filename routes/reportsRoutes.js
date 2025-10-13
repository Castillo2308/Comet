import express from 'express';
import controller from '../controllers/reportsController.js';
import { requireAuth, requireRole } from '../lib/auth.js';

const router = express.Router();

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, requireRole('admin','reports'), controller.create);
router.put('/:id', requireAuth, requireRole('admin','reports'), controller.update);
router.delete('/:id', requireAuth, requireRole('admin','reports'), controller.remove);

export default router;
