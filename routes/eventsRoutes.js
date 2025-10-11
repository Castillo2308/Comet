import express from 'express';
import eventsController from '../controllers/eventsController.js';

const router = express.Router();

router.get('/', eventsController.getEvents);
router.post('/', eventsController.postEvent);
router.put('/:id', eventsController.putEvent);
router.delete('/:id', eventsController.removeEvent);

export default router;
