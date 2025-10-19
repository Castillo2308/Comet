import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Heart, MessageCircle, MoreHorizontal, Send, Clock, Camera, X, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';
import { api } from '../lib/api';

interface Post {
  id: string;
  author: string; // display name
  ownerId?: string; // cedula for ownership checks
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface Comment {
  id: string;
  author: string; // display name
  ownerId?: string; // cedula for ownership checks
  avatar: string;
  time: string;
  content: string;
  likes: number;
  isLiked: boolean;
}

const mockComments: { [key: string]: Comment[] } = {};

export default function Community() {
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>(mockComments);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ users: number; posts: number; comments: number }>({ users: 0, posts: 0, comments: 0 });
  const [limit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const toPreview = (url?: string) => {
    if (!url) return undefined;
    try {
      const raw = String(url);
      if (/\/file\/d\//.test(raw) && /\/preview(\?|$)/.test(raw)) return raw;
      const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
      let id = m?.[1];
      if (!id) { try { const u = new URL(raw); id = u.searchParams.get('id') || undefined; } catch {} }
      return id ? `https://drive.google.com/file/d/${id}/preview` : raw;
    } catch { return url; }
  };

  const mapPosts = (arr: any[]): Post[] => {
    return (arr || []).map((p: any) => {
      const authorRaw = p.author; // could be cedula or display name (legacy)
      const display = p.authorName || (typeof authorRaw === 'string' && authorRaw.includes(' ') ? authorRaw : 'Usuario');
      return ({
        id: String(p._id || ''),
        author: display,
        ownerId: typeof authorRaw === 'string' && !authorRaw.includes(' ') ? authorRaw : undefined,
        avatar: display.split(' ').map((s:string)=>s[0]).join('').slice(0,2) || 'U',
        time: new Date(p.date).toLocaleString(),
        content: p.content,
        image: toPreview(p.photo_link) || undefined,
        likes: p.likes || 0,
        comments: p.comments_count || 0,
        isLiked: false,
      });
    });
  };

  const loadPage = useCallback(async (nextOffset: number) => {
    if (loadingMore || (!hasMore && nextOffset !== 0)) return;
    setLoadingMore(true);
    try {
      const r = await fetch(`/api/forum?limit=${limit}&offset=${nextOffset}`, { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` } });
      const data = r.ok ? await r.json() : [];
      const items = Array.isArray(data) ? data : (data?.items || []);
      const page = Array.isArray(data) ? undefined : data?.page;
      const mapped = mapPosts(items);
      if (nextOffset === 0) setPosts(mapped);
      else setPosts(prev => [...prev, ...mapped]);
      setHasMore(page?.hasMore ?? (mapped.length === limit));
      setOffset(nextOffset + (page?.limit ?? limit));
      // stats: prefer total if provided
      if (page?.total != null) {
        setStats(prev => ({ ...prev, posts: Number(page.total) || 0 }));
      } else if (nextOffset === 0) {
        setStats(prev => ({ ...prev, posts: mapped.length }));
      }
    } catch {
      // keep previous state
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, limit, loadingMore]);

  useEffect(() => {
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (node && scrollRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0]?.isIntersecting) {
          if (hasMore && !loadingMore) {
            loadPage(offset);
          }
        }
      }, { root: scrollRef.current, threshold: 0.1 });
      observerRef.current.observe(node);
    }
  }, [hasMore, loadingMore, offset, loadPage]);

  const handleLikePost = async (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
    // fire-and-forget call to backend if available
      try {
        await api(`/forum/${postId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decrement: false }) });
      } catch {}
  };

  const handleLikeComment = async (postId: string, commentId: string) => {
    setComments(prev => ({
      ...prev,
      [postId]: prev[postId]?.map(comment =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
            }
          : comment
      ) || []
    }));
      try { await api(`/forum/comments/${commentId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' } }); } catch {}
  };

  const handleAddComment = async (postId: string) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    const newCommentObj: Comment = {
      id: `tmp-${Date.now()}`,
      author: `${user?.name} ${user?.lastname}`,
      ownerId: user?.cedula,
      avatar: `${user?.name?.charAt(0)}${user?.lastname?.charAt(0)}`,
      time: 'ahora',
      content: commentText,
      likes: 0,
      isLiked: false
    };

    // Optimistic add with a temp id, then swap to server id when response returns
    setComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newCommentObj]
    }));

    setPosts(posts.map(post =>
      post.id === postId
        ? { ...post, comments: post.comments + 1 }
        : post
    ));

    setNewComment(prev => ({ ...prev, [postId]: '' }));
      try {
        const res = await api(`/forum/${postId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: commentText, author: user?.cedula })
        });
        const created = await res.json();
        // Replace the temporary comment with the persisted one (use real _id)
        setComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c => c.id === newCommentObj.id ? {
            ...c,
            id: String(created._id || created.id || c.id),
            time: new Date(created.date || Date.now()).toLocaleString(),
          } : c)
        }));
      } catch {}
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPostImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setNewPostImage(null);
    setNewPostImagePreview(null);
  };

  const handleAddPost = async () => {
    if (!newPost.trim()) return;

    try {
      let photoUrl: string | undefined = undefined;
      if (newPostImage) {
        const fd = new FormData();
        fd.append('file', newPostImage);
        const up = await api(`/uploads/photo?type=post`, { method: 'POST', body: fd });
        if (up.ok) {
          const j = await up.json();
          photoUrl = j.url;
        }
      }
      const res = await api('/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPost,
          photo_link: photoUrl || undefined,
          author: user?.cedula,
          date: new Date().toISOString()
        })
      });
      if (res.ok) {
        const saved = await res.json();
        const toPreview = (url?: string) => {
          if (!url) return undefined;
          try {
            const raw = String(url);
            if (/\/file\/d\//.test(raw) && /\/preview(\?|$)/.test(raw)) return raw;
            const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
            let id = m?.[1];
            if (!id) { try { const u = new URL(raw); id = u.searchParams.get('id') || undefined; } catch {} }
            return id ? `https://drive.google.com/file/d/${id}/preview` : raw;
          } catch { return url; }
        };
        const newPostObj: Post = {
          id: String(saved._id || saved.id || `tmp-${Date.now()}`),
          author: saved.authorName || `${user?.name} ${user?.lastname}`,
          ownerId: user?.cedula,
          avatar: `${user?.name?.charAt(0)}${user?.lastname?.charAt(0)}`,
          time: new Date(saved.date || Date.now()).toLocaleString(),
          content: saved.content ?? newPost,
          image: toPreview(saved.photo_link || photoUrl) || undefined,
          likes: saved.likes ?? 0,
          comments: saved.comments_count ?? 0,
          isLiked: false
        };
        setPosts([newPostObj, ...posts]);
      } else {
        const newPostObj: Post = {
          id: `tmp-${Date.now()}`,
          author: `${user?.name} ${user?.lastname}`,
          ownerId: user?.cedula,
          avatar: `${user?.name?.charAt(0)}${user?.lastname?.charAt(0)}`,
          time: 'ahora',
          content: newPost,
          image: newPostImagePreview || undefined,
          likes: 0,
          comments: 0,
          isLiked: false
        };
        setPosts([newPostObj, ...posts]);
      }
    } catch {
      const newPostObj: Post = {
        id: `tmp-${Date.now()}`,
        author: `${user?.name} ${user?.lastname}`,
        ownerId: user?.cedula,
        avatar: `${user?.name?.charAt(0)}${user?.lastname?.charAt(0)}`,
        time: 'ahora',
        content: newPost,
        image: newPostImagePreview || undefined,
        likes: 0,
        comments: 0,
        isLiked: false
      };
      setPosts([newPostObj, ...posts]);
    }
    setNewPost('');
    setNewPostImage(null);
    setNewPostImagePreview(null);
    setShowNewPost(false);
  };

  const isOwner = (item: { ownerId?: string; author?: string }) => {
    if (!user) return false;
    if (item.ownerId && user.cedula && item.ownerId === user.cedula) return true;
    // Fallback to name-based match for legacy data
    const full = `${user.name} ${user.lastname}`.trim().toLowerCase();
    const disp = (item.author || '').toLowerCase();
    return !!full && !!disp && full === disp;
  };

  const deletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try { await api(`/forum/${postId}`, { method: 'DELETE' }); } catch {}
  };

  const deleteComment = async (postId: string, commentId: string) => {
    setComments(prev => ({ ...prev, [postId]: (prev[postId] || []).filter(c => c.id !== commentId) }));
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: Math.max(0, p.comments - 1) } : p));
    try { await api(`/forum/comments/${commentId}`, { method: 'DELETE' }); } catch {}
  };

  return (
  <div ref={scrollRef} className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 min-h-screen bg-gray-50">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Header - standardized to Buses style */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-5 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Comunidad</h1>
              <p className="text-blue-100 text-sm">Conecta con tu comunidad local</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-white text-blue-700 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm shadow-md hover:bg-blue-50 transition-all duration-200"
          >
            {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
          </button>
        </div>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4">
        {/* New Post Button */}
        <section className="animate-fadeInUp">
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Crear nueva publicación</span>
          </button>
        </section>

        {/* New Post Form */}
        {showNewPost && (
          <section className="animate-slideInRight bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{user?.name} {user?.lastname}</h3>
                <span className="text-gray-500 text-xs">Publicando ahora</span>
              </div>
            </div>

            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="¿Qué quieres compartir con tu comunidad?"
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
              rows={3}
            />

            {/* Image Preview */}
            {newPostImagePreview && (
              <div className="mt-3 relative">
                <img
                  src={newPostImagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center mt-3">
              <label className="flex items-center space-x-2 text-blue-500 hover:text-blue-600 cursor-pointer transition-colors duration-200">
                <Camera className="h-5 w-5" />
                <span className="text-sm font-medium">{newPostImage ? 'Cambiar foto' : 'Añadir foto'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setShowNewPost(false);
                    setNewPost('');
                    removeImage();
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  disabled={!newPost.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
                  onClick={handleAddPost}
                >
                  Publicar
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Posts Feed */}
        <section className="space-y-4">
          {posts.map((post, index) => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Post Header */}
              <div className="p-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center transform transition-transform duration-200 hover:scale-110">
                      <span className="text-blue-600 font-semibold text-sm">{post.avatar}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{post.author}</h3>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{post.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)} className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors duration-200 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {openMenuPostId === post.id && isOwner(post) && (
                      <div className="absolute right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded shadow z-10">
                        <button onClick={() => deletePost(post.id)} className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600">
                          <Trash2 className="h-4 w-4" /> Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-800 dark:text-gray-200 text-sm mb-3">{post.content}</p>

                {/* Post Image */}
                {post.image && (
                  /\/file\/d\//.test(post.image) && /\/preview(\?|$)/.test(post.image) ? (
                    <div className="w-full mb-3">
                      <iframe
                        src={post.image}
                        className="w-full rounded-lg"
                        style={{ height: 240, border: 'none' }}
                        allow="autoplay; encrypted-media"
                        loading="lazy"
                        title="Vista previa"
                      />
                    </div>
                  ) : (
                    <img
                      src={post.image}
                      alt="Post content"
                      className="w-full h-48 object-cover rounded-lg mb-3 transition-transform duration-300 hover:scale-105"
                    />
                  )
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center space-x-1 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                        post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current animate-pulse' : ''}`} />
                      <span className="text-xs font-medium">{post.likes}</span>
                    </button>
                    <button
                      onClick={async () => {
                        const next = expandedPost === post.id ? null : post.id;
                        setExpandedPost(next);
                        if (next && !comments[next]) {
                          try {
                            const res = await api(`/forum/${post.id}/comments`);
                            if (res.ok) {
                              const data = await res.json();
                              const mapped: Comment[] = (data || []).map((c:any) => {
                                const isCed = typeof c.author === 'string' && /^\d{5,12}$/.test(c.author);
                                const display = c.authorName || (typeof c.author === 'string' && c.author.includes(' ') ? c.author : 'Usuario');
                                return ({
                                  id: String(c._id || c.id || `tmp-${Date.now()}`),
                                  author: display,
                                  ownerId: isCed ? c.author : undefined,
                                  avatar: display.split(' ').map((s:string)=>s[0]).join('').slice(0,2) || 'U',
                                  time: new Date(c.date).toLocaleString(),
                                  content: c.content,
                                  likes: c.likes || 0,
                                  isLiked: false
                                });
                              });
                              setComments(prev => ({ ...prev, [post.id]: mapped }));
                            }
                          } catch {}
                        }
                      }}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-all duration-200 transform hover:scale-110 active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">{post.comments}</span>
                    </button>
                    {/* Compartir eliminado */}
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {expandedPost === post.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 p-4 pt-3 bg-gray-50 dark:bg-gray-900 animate-slideInRight">
                  {/* Existing Comments */}
                  <div className="space-y-3 mb-4">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-2 animate-fadeInUp">
                        <div className="bg-gray-200 dark:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transform transition-transform duration-200 hover:scale-110">
                          <span className="text-gray-600 dark:text-gray-200 font-medium text-xs">{comment.avatar}</span>
                        </div>
                        <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-xs">{comment.author}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 dark:text-gray-400 text-xs">{comment.time}</span>
                              {isOwner(comment) && (
                                <button onClick={() => deleteComment(post.id, comment.id)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 text-xs mb-2">{comment.content}</p>
                          <button
                            onClick={() => handleLikeComment(post.id, comment.id)}
                            className={`flex items-center space-x-1 transition-all duration-200 transform hover:scale-110 active:scale-95 ${
                              comment.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`h-3 w-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span className="text-xs">{comment.likes}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-medium text-xs">
                        {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="text"
                        value={newComment[post.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="Escribe un comentario..."
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        disabled={!newComment[post.id]?.trim()}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-110 active:scale-95"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Sentinel ~10 from end to prefetch next page */}
          {posts.length > 0 && (
            <div ref={setSentinelRef} style={{ height: 1 }} />
          )}
          {loadingMore && (
            <div className="text-center text-xs text-gray-500 py-2">Cargando más…</div>
          )}
        </section>

        {/* Community Stats */}
        <section className="animate-fadeInUp bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Estadísticas de la Comunidad</h3>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="transform transition-transform duration-200 hover:scale-110">
              <div className="text-lg font-bold text-green-600">{stats.posts}</div>
              <div className="text-xs text-gray-600">Publicaciones</div>
            </div>
            <div className="transform transition-transform duration-200 hover:scale-110">
              <div className="text-lg font-bold text-orange-600">{stats.comments}</div>
              <div className="text-xs text-gray-600">Comentarios</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}