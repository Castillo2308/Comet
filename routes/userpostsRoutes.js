import express from 'express';
import controller from '../controllers/userpostsController.js';

const router = express.Router();

router.get('/', controller.list);
router.post('/', controller.create);
router.post('/:id/like', controller.like);
router.delete('/:id', controller.remove);
router.get('/:id/comments', controller.listComments);
router.post('/:id/comments', controller.addComment);
router.post('/comments/:commentId/like', controller.likeComment);
router.delete('/comments/:commentId', controller.removeComment);

export default router;
