import React, { useState } from 'react';
import { MapPin, Clock, AlertTriangle, Plus, MessageCircle, User, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

interface RedPoint {
  id: number;
  location: string;
  description: string;
  timeRange: string;
  author: string;
  date: string;
  riskLevel: 'Alto' | 'Medio' | 'Bajo';
  comments: Comment[];
}

interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
}

const mockRedPoints: RedPoint[] = [
  {
    id: 1,
    location: 'Parque Central',
    description: 'Entre las 8:00 PM y 11:00 PM este lugar es muy peligroso, han robado varias veces.',
    timeRange: '8:00 PM - 11:00 PM',
    author: 'María González',
    date: 'hace 2 horas',
    riskLevel: 'Alto',
    comments: [
      {
        id: 1,
        author: 'Carlos Rodríguez',
        content: 'Confirmo, a mi hermano le robaron ahí la semana pasada.',
        date: 'hace 1 hora'
      }
    ]
  },
  {
    id: 2,
    location: 'Puente del Río',
    description: 'De madrugada (2:00 AM - 5:00 AM) es peligroso pasar por aquí solo.',
    timeRange: '2:00 AM - 5:00 AM',
    author: 'Luis Vargas',
    date: 'hace 5 horas',
    riskLevel: 'Medio',
    comments: []
  },
  {
    id: 3,
    location: 'Parada de Bus Centro',
    description: 'Los fines de semana por la noche hay mucha actividad sospechosa.',
    timeRange: 'Viernes y Sábados 10:00 PM - 2:00 AM',
    author: 'Ana Jiménez',
    date: 'hace 1 día',
    riskLevel: 'Alto',
    comments: [
      {
        id: 2,
        author: 'Pedro Mora',
        content: 'Es cierto, mejor evitar esa zona los fines de semana.',
        date: 'hace 12 horas'
      },
      {
        id: 3,
        author: 'Sofía Castro',
        content: 'Deberían poner más iluminación ahí.',
        date: 'hace 8 horas'
      }
    ]
  }
];

export default function RedPoints() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [redPoints, setRedPoints] = useState<RedPoint[]>(mockRedPoints);
  const [expandedPoint, setExpandedPoint] = useState<number | null>(null);
  const [newComment, setNewComment] = useState<{ [key: number]: string }>({});
  const [newPoint, setNewPoint] = useState({
    location: '',
    description: '',
    timeRange: '',
    riskLevel: 'Medio' as 'Alto' | 'Medio' | 'Bajo'
  });

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Alto': return 'bg-red-100 text-red-600 border-red-200';
      case 'Medio': return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case 'Bajo': return 'bg-green-100 text-green-600 border-green-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const handleAddPoint = (e: React.FormEvent) => {
    e.preventDefault();
    const point: RedPoint = {
      id: Date.now(),
      ...newPoint,
      author: `${user?.name} ${user?.lastName}`,
      date: 'ahora',
      comments: []
    };
    setRedPoints([point, ...redPoints]);
    setNewPoint({ location: '', description: '', timeRange: '', riskLevel: 'Medio' });
    setShowAddModal(false);
  };

  const handleAddComment = (pointId: number) => {
    const commentText = newComment[pointId];
    if (!commentText?.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      author: `${user?.name} ${user?.lastName}`,
      content: commentText,
      date: 'ahora'
    };

    setRedPoints(redPoints.map(point =>
      point.id === pointId
        ? { ...point, comments: [...point.comments, comment] }
        : point
    ));

    setNewComment(prev => ({ ...prev, [pointId]: '' }));
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 min-h-screen bg-gray-50">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Add Point Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center animate-fadeIn">
          <div className="bg-white rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-slideUp">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Añadir Punto Rojo</h2>
                    <p className="text-sm text-gray-600">Reporta una zona peligrosa</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <Plus className="h-5 w-5 text-gray-500 transform rotate-45" />
                </button>
              </div>

              <form onSubmit={handleAddPoint} className="space-y-4">
                <input
                  type="text"
                  placeholder="Ubicación específica"
                  value={newPoint.location}
                  onChange={(e) => setNewPoint({ ...newPoint, location: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  required
                />

                <textarea
                  placeholder="Describe el peligro y las circunstancias..."
                  value={newPoint.description}
                  onChange={(e) => setNewPoint({ ...newPoint, description: e.target.value })}
                  rows={3}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none bg-gray-50"
                  required
                />

                <input
                  type="text"
                  placeholder="Horario peligroso (ej: 8:00 PM - 11:00 PM)"
                  value={newPoint.timeRange}
                  onChange={(e) => setNewPoint({ ...newPoint, timeRange: e.target.value })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                  required
                />

                <select
                  value={newPoint.riskLevel}
                  onChange={(e) => setNewPoint({ ...newPoint, riskLevel: e.target.value as 'Alto' | 'Medio' | 'Bajo' })}
                  className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
                >
                  <option value="Bajo">Riesgo Bajo</option>
                  <option value="Medio">Riesgo Medio</option>
                  <option value="Alto">Riesgo Alto</option>
                </select>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-medium transform hover:scale-105 active:scale-95"
                  >
                    Añadir Punto
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">Puntos Rojos</h1>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Aquí puedes mantenerte al tanto sobre la seguridad del cantón.</p>
      </div>

      {/* Map Section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <section className="animate-fadeInUp mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100 relative overflow-hidden">
            {/* Simulated map background */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600"></div>
            </div>
            
            {/* Map content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Alajuelita - Zonas Calientes</h3>
                <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                  <span className="text-xs font-medium text-blue-600">Puntos Rojos</span>
                </div>
              </div>
              
              {/* Simulated map with danger points */}
              <div className="relative h-32 bg-white bg-opacity-50 rounded-lg border border-blue-200">
                {/* Danger points */}
                <div className="absolute top-2 left-4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute top-6 right-6 w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute bottom-4 left-1/2 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
                <div className="absolute bottom-2 right-4 w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-lg"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                    <span className="text-xs text-blue-600 font-medium">Zonas Calientes</span>
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center space-x-4 mt-3 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700">Alto Riesgo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-700">Riesgo Medio</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Add Point Button */}
        <section className="animate-fadeInUp mb-4" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full bg-red-500 text-white py-3 px-4 rounded-xl font-semibold text-sm hover:bg-red-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Añadir Comentario</span>
          </button>
        </section>

        {/* Red Points List */}
        <section className="space-y-4">
          {redPoints.map((point, index) => (
            <div
              key={point.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{point.location}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                        <span>Por {point.author}</span>
                        <span>•</span>
                        <span>{point.date}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(point.riskLevel)}`}>
                    {point.riskLevel}
                  </span>
                </div>

                <p className="text-gray-800 text-sm mb-3">{point.description}</p>

                <div className="flex items-center space-x-2 mb-3">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-orange-600 font-medium">{point.timeRange}</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setExpandedPoint(expandedPoint === point.id ? null : point.id)}
                    className="flex items-center space-x-1 text-blue-500 hover:text-blue-600 transition-colors duration-200"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">{point.comments.length} comentarios</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {expandedPoint === point.id && (
                <div className="border-t border-gray-100 p-4 pt-3 bg-gray-50 animate-slideInRight">
                  {/* Existing Comments */}
                  <div className="space-y-3 mb-4">
                    {point.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-2 animate-fadeInUp">
                        <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900 text-xs">{comment.author}</span>
                            <span className="text-gray-500 text-xs">{comment.date}</span>
                          </div>
                          <p className="text-gray-800 text-xs">{comment.content}</p>
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
                        value={newComment[point.id] || ''}
                        onChange={(e) => setNewComment(prev => ({ ...prev, [point.id]: e.target.value }))}
                        placeholder="Añade un comentario..."
                        className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all duration-200"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(point.id)}
                      />
                      <button
                        onClick={() => handleAddComment(point.id)}
                        disabled={!newComment[point.id]?.trim()}
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

        {/* Safety Tips */}
        <section className="animate-fadeInUp mt-6">
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Consejos de Seguridad
            </h3>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• Evita caminar solo por zonas marcadas como peligrosas</li>
              <li>• Mantente alerta en los horarios indicados como riesgosos</li>
              <li>• Reporta cualquier actividad sospechosa a las autoridades</li>
              <li>• Comparte tu ubicación con familiares cuando salgas</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}