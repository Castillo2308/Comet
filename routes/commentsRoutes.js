import express from 'express';
// Comments are handled under forum routes; this placeholder exists for future expansion.
const router = express.Router();
router.get('/', (_req, res) => res.json({ message: 'Use /api/forum/:id/comments' }));
export default router;
