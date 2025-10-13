import express from 'express';
import eventsController from '../controllers/eventsController.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

router.get('/', requireAuth, eventsController.getEvents);
router.post('/', requireAuth, eventsController.postEvent);
router.put('/:id', requireAuth, eventsController.putEvent);
router.delete('/:id', requireAuth, eventsController.removeEvent);

export default router;
