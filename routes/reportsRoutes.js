import express from 'express';
import controller from '../controllers/reportsController.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
// Allow authors to delete their own report, admins and reports role too
router.delete('/:id', requireAuth, controller.remove);

export default router;
