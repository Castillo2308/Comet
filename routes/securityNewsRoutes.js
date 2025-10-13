import express from 'express';
import controller from '../controllers/securityNewsController.js';
import { requireAuth, requireRole } from '../lib/auth.js';

const router = express.Router();

router.get('/', requireAuth, requireRole('admin','security'), controller.list);
router.post('/', requireAuth, requireRole('admin','security'), controller.create);
router.put('/:id', requireAuth, requireRole('admin','security'), controller.update);
router.delete('/:id', requireAuth, requireRole('admin','security'), controller.remove);

export default router;
