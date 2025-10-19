import express from 'express';
import controller from '../controllers/userpostsController.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

router.get('/', requireAuth, controller.list);
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.post('/:id/like', requireAuth, controller.like);
router.delete('/:id', requireAuth, controller.remove);
router.get('/:id/comments', requireAuth, controller.listComments);
router.post('/:id/comments', requireAuth, controller.addComment);
router.post('/comments/:commentId/like', requireAuth, controller.likeComment);
router.delete('/comments/:commentId', requireAuth, controller.removeComment);
// Moderation endpoints
router.post('/:id/approve', requireAuth, controller.approve);
router.post('/:id/reject', requireAuth, controller.reject);

export default router;
