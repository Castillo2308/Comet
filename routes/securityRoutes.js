import express from 'express';
import controller from '../controllers/securityController.js';

const router = express.Router();

router.get('/hotspots', controller.list);
router.post('/hotspots', controller.create);
router.get('/hotspots/:id/comments', controller.comments);
router.post('/hotspots/:id/comments', controller.addComment);
router.delete('/hotspots/:id', controller.remove);
router.put('/hotspots/:id', controller.update);

export default router;
