import express from 'express';
import controller from '../controllers/securityController.js';
import { requireAuth, requireRole } from '../lib/auth.js';

const router = express.Router();

router.get('/hotspots', requireAuth, controller.list);
// Allow any authenticated user to create hotspots
router.post('/hotspots', requireAuth, controller.create);
router.get('/hotspots/:id/comments', requireAuth, controller.comments);
// Allow any authenticated user to comment on hotspots
router.post('/hotspots/:id/comments', requireAuth, controller.addComment);
router.delete('/hotspots/:id', requireAuth, requireRole('admin','security'), controller.remove);
router.put('/hotspots/:id', requireAuth, requireRole('admin','security'), controller.update);

export default router;
