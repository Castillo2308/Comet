import express from 'express';
import controller from '../controllers/govpostsController.js';
import { requireAuth, requireRole } from '../lib/auth.js';

const router = express.Router();

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, requireRole('admin','news'), controller.create);
router.put('/:id', requireAuth, requireRole('admin','news'), controller.update);
router.delete('/:id', requireAuth, requireRole('admin','news'), controller.remove);

export default router;
