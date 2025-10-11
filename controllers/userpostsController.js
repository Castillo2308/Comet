import { listPosts, createPost, toggleLikePost, deletePost, listComments, addComment, likeComment, deleteComment } from '../models/forumModel.js';

export default {
  async list(_req, res) {
    try { res.json(await listPosts()); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list posts' }); }
  },
  async create(req, res) {
    try { res.status(201).json(await createPost(req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to create post' }); }
  },
  async like(req, res) {
    try { res.json(await toggleLikePost(req.params.id, req.body.decrement ? -1 : 1)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to like post' }); }
  },
  async remove(req, res) {
    try { const ok = await deletePost(req.params.id); if (!ok) return res.status(404).json({ message: 'Post not found' }); res.json({ message: 'Post deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete post' }); }
  },
  async listComments(req, res) {
    try { res.json(await listComments(req.params.id)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to list comments' }); }
  },
  async addComment(req, res) {
    try { res.status(201).json(await addComment(req.params.id, req.body)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to add comment' }); }
  },
  async likeComment(req, res) {
    try { res.json(await likeComment(req.params.commentId, req.body.decrement ? -1 : 1)); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to like comment' }); }
  },
  async removeComment(req, res) {
    try { const ok = await deleteComment(req.params.commentId); if (!ok) return res.status(404).json({ message: 'Comment not found' }); res.json({ message: 'Comment deleted' }); } catch (e) { console.error(e); res.status(500).json({ message: 'Failed to delete comment' }); }
  }
};
