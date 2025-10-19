import { listPosts, createPost, toggleLikePost, deletePost, listComments, addComment, likeComment, deleteComment, updatePost, getPostById, getCommentById } from '../models/forumModel.js';
import { analyzeImageForModeration } from '../lib/vision.js';
import { isPrivileged } from '../lib/auth.js';

export default {
  async list(_req, res) {
    try {
      const role = _req.user?.role;
      // Regular users: only approved posts; admins/moderators: all
      const filter = isPrivileged(role) ? {} : { $or: [ { status: 'approved' }, { status: { $exists: false } } ] };
      const hasPaging = typeof _req.query.limit !== 'undefined' || typeof _req.query.offset !== 'undefined';
      const limit = Math.max(1, Math.min(100, parseInt(_req.query.limit, 10) || 20));
      const offset = Math.max(0, parseInt(_req.query.offset, 10) || 0);
      const { items, hasMore, total } = await listPosts(filter, { limit, offset });
      // Normalize status for legacy docs
      if (hasPaging) {
        res.json({
          items: items.map(r => ({ ...r, status: r.status || 'approved' })),
          page: { limit, offset, hasMore, total }
        });
      } else {
        res.json(items.map(r => ({ ...r, status: r.status || 'approved' })));
      }
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list posts' }); }
  },
  async create(req, res) {
    try {
      const body = { ...req.body };
      if (!body.author && req.user?.cedula) body.author = req.user.cedula;
      // Force pending status until AI check
      const created = await createPost({ ...body, status: 'pending' });
      res.status(201).json(created);
      // async AI audit
      setImmediate(async () => {
        try {
          const ai = await analyzeImageForModeration({ photo_link: created.photo_link, text: created.content });
          const patch = {
            ai_flagged: ai.ai_flagged,
            ai_summary: ai.ai_summary,
            ai_scores: ai.ai_scores,
            ai_labels: ai.ai_labels,
            ai_safe: ai.ai_safe,
            ai_mismatch: ai.ai_mismatch,
            ai_text_toxic: ai.ai_text_toxic,
            ai_checked_at: ai.checked_at,
          };
          if (ai.autoApprove) patch.status = 'approved';
          else if (ai.ai_text_toxic) patch.status = 'rejected';
          await updatePost(created._id || created.id, patch);
        } catch (e) { /* no-op */ }
      });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create post' }); }
  },
  async like(req, res) {
    try { res.json(await toggleLikePost(req.params.id, req.body.decrement ? -1 : 1)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to like post' }); }
  },
  async remove(req, res) {
    try {
      const post = await getPostById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      const role = req.user?.role;
      const cedula = req.user?.cedula;
  const canDelete = isPrivileged(role) || (cedula && String(post.author) === String(cedula));
      if (!canDelete) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deletePost(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Post not found' });
      res.json({ message: 'Post deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete post' }); }
  },
  async update(req, res) {
    try {
      const updated = await updatePost(req.params.id, req.body);
      if (!updated) return res.status(404).json({ message: 'Post not found' });
      res.json(updated);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to update post' }); }
  },
  async approve(req, res) {
    try {
      if (!isPrivileged(req.user?.role)) return res.status(403).json({ message: 'Prohibido' });
      const updated = await updatePost(req.params.id, { status: 'approved' });
      if (!updated) return res.status(404).json({ message: 'Post not found' });
      res.json(updated);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to approve post' }); }
  },
  async reject(req, res) {
    try {
      if (!isPrivileged(req.user?.role)) return res.status(403).json({ message: 'Prohibido' });
      const updated = await updatePost(req.params.id, { status: 'rejected' });
      if (!updated) return res.status(404).json({ message: 'Post not found' });
      res.json(updated);
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to reject post' }); }
  },
  async listComments(req, res) {
    try { res.json(await listComments(req.params.id)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list comments' }); }
  },
  async addComment(req, res) {
    try {
      const body = { ...req.body };
      if (!body.author && req.user?.cedula) body.author = req.user.cedula;
      res.status(201).json(await addComment(req.params.id, body));
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to add comment' }); }
  },
  async likeComment(req, res) {
    try { res.json(await likeComment(req.params.commentId, req.body.decrement ? -1 : 1)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to like comment' }); }
  },
  async removeComment(req, res) {
    try {
      const comment = await getCommentById(req.params.commentId);
      if (!comment) return res.status(404).json({ message: 'Comment not found' });
      const role = req.user?.role;
      const cedula = req.user?.cedula;
  const canDelete = isPrivileged(role) || (cedula && String(comment.author) === String(cedula));
      if (!canDelete) return res.status(403).json({ message: 'Prohibido' });
      const ok = await deleteComment(req.params.commentId);
      if (!ok) return res.status(404).json({ message: 'Comment not found' });
      res.json({ message: 'Comment deleted' });
    } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete comment' }); }
  }
};
