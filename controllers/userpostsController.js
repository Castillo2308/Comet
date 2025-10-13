import { listPosts, createPost, toggleLikePost, deletePost, listComments, addComment, likeComment, deleteComment, updatePost, getPostById, getCommentById } from '../models/forumModel.js';
import { isPrivileged } from '../lib/auth.js';

export default {
  async list(_req, res) {
    try { res.json(await listPosts()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list posts' }); }
  },
  async create(req, res) {
    try {
      const body = { ...req.body };
      if (!body.author && req.user?.cedula) body.author = req.user.cedula;
      res.status(201).json(await createPost(body));
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
