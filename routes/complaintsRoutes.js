import express from 'express';
import controller from '../controllers/complaintsController.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
// Only authenticated users can delete; controller enforces owner-or-role
router.delete('/:id', requireAuth, controller.remove);

export default router;
