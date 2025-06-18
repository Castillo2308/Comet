import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Send, User, Clock, Camera, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

interface Post {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface Comment {
  id: number;
  author: string;
  avatar: string;
  time: string;
  content: string;
  likes: number;
  isLiked: boolean;
}

const mockPosts: Post[] = [
  {
    id: 1,
    author: 'María González',
    avatar: 'MG',
    time: 'hace 2 horas',
    content: '¡Excelente trabajo de la municipalidad limpiando el parque central! Se ve hermoso ahora. 🌳✨',
    image: 'https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&dpr=1',
    likes: 24,
    comments: 8,
    isLiked: false
  },
  {
    id: 2,
    author: 'Carlos Rodríguez',
    avatar: 'CR',
    time: 'hace 4 horas',
    content: 'Vecinos, ¿alguien sabe si van a arreglar el semáforo de la esquina? Lleva varios días intermitente.',
    likes: 12,
    comments: 15,
    isLiked: true
  },
  {
    id: 3,
    author: 'Ana Jiménez',
    avatar: 'AJ',
    time: 'hace 6 horas',
    content: 'Recordatorio: Mañana es la feria de emprendedores en el centro comunal. ¡Los esperamos! 🛍️',
    likes: 31,
    comments: 6,
    isLiked: false
  }
];

const mockComments: { [key: number]: Comment[] } = {
  1: [
    {
      id: 1,
      author: 'Pedro Mora',
      avatar: 'PM',
      time: 'hace 1 hora',
      content: '¡Totalmente de acuerdo! Se ve increíble.',
      likes: 3,
      isLiked: false
    },
    {
      id: 2,
      author: 'Sofía Castro',
      avatar: 'SC',
      time: 'hace 30 min',
      content: 'Gracias por compartir, no había visto el resultado final.',
      likes: 1,
      isLiked: true
    }
  ],
  2: [
    {
      id: 3,
      author: 'Luis Vargas',
      avatar: 'LV',
      time: 'hace 3 horas',
      content: 'Yo también lo he notado. Ya reporté a la municipalidad.',
      likes: 5,
      isLiked: false
    }
  ]
};

export default function Community() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [comments, setComments] = useState<{ [key: number]: Comment[] }>(mockComments);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [newPost, setNewPost] = useState('');
  const [newPostImage, setNewPostImage] = useState<File | null>(null);
  const [newPostImagePreview, setNewPostImagePreview] = useState<string | null>(null);
  const [showNewPost, setShowNewPost] = useState(false);

  const handleLikePost = (postId: number) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked, 
            likes: post.isLiked ? post.likes - 1 : post.likes + 1 
          }
        : post
    ));
  };

  const handleLikeComment = (postId: number, commentId: number) => {
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
  };

  const handleAddComment = (postId: number) => {
    const commentText = newComment[postId];
    if (!commentText?.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now(),
      author: `${user?.name} ${user?.lastName}`,
      avatar: `${user?.name?.charAt(0)}${user?.lastName?.charAt(0)}`,
      time: 'ahora',
      content: commentText,
      likes: 0,
      isLiked: false
    };

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

  const handleAddPost = () => {
    if (!newPost.trim()) return;

    const newPostObj: Post = {
      id: Date.now(),
      author: `${user?.name} ${user?.lastName}`,
      avatar: `${user?.name?.charAt(0)}${user?.lastName?.charAt(0)}`,
      time: 'ahora',
      content: newPost,
      image: newPostImagePreview || undefined,
      likes: 0,
      comments: 0,
      isLiked: false
    };

    setPosts([newPostObj, ...posts]);
    setNewPost('');
    setNewPostImage(null);
    setNewPostImagePreview(null);
    setShowNewPost(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 min-h-screen bg-gray-50">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Header */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">Comunidad</h1>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Conecta con tu comunidad local</p>
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
            <div className="flex items-start space-x-3 mb-3">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold text-sm">
                  {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{user?.name} {user?.lastName}</h3>
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
                <span className="text-sm font-medium">Añadir foto</span>
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
                  onClick={handleAddPost}
                  disabled={!newPost.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
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
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
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
                      <h3 className="font-semibold text-gray-900 text-sm">{post.author}</h3>
                      <div className="flex items-center space-x-1 text-gray-500 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>{post.time}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>

                {/* Post Content */}
                <p className="text-gray-800 text-sm mb-3">{post.content}</p>

                {/* Post Image */}
                {post.image && (
                  <img
                    src={post.image}
                    alt="Post content"
                    className="w-full h-48 object-cover rounded-lg mb-3 transition-transform duration-300 hover:scale-105"
                  />
                )}

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
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
                      onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                      className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-all duration-200 transform hover:scale-110 active:scale-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">{post.comments}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-all duration-200 transform hover:scale-110 active:scale-95">
                      <Share2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Compartir</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              {expandedPost === post.id && (
                <div className="border-t border-gray-100 p-4 pt-3 bg-gray-50 animate-slideInRight">
                  {/* Existing Comments */}
                  <div className="space-y-3 mb-4">
                    {comments[post.id]?.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-2 animate-fadeInUp">
                        <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transform transition-transform duration-200 hover:scale-110">
                          <span className="text-gray-600 font-medium text-xs">{comment.avatar}</span>
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 text-xs">{comment.author}</span>
                            <span className="text-gray-500 text-xs">{comment.time}</span>
                          </div>
                          <p className="text-gray-800 text-xs mb-2">{comment.content}</p>
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
                        {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
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
        </section>

        {/* Community Stats */}
        <section className="animate-fadeInUp bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">Estadísticas de la Comunidad</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="transform transition-transform duration-200 hover:scale-110">
              <div className="text-lg font-bold text-blue-600">1,247</div>
              <div className="text-xs text-gray-600">Miembros</div>
            </div>
            <div className="transform transition-transform duration-200 hover:scale-110">
              <div className="text-lg font-bold text-green-600">89</div>
              <div className="text-xs text-gray-600">Publicaciones</div>
            </div>
            <div className="transform transition-transform duration-200 hover:scale-110">
              <div className="text-lg font-bold text-orange-600">324</div>
              <div className="text-xs text-gray-600">Comentarios</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}