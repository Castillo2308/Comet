import React, { useEffect, useState } from 'react';
import { MapPin, Clock, AlertTriangle, Plus, MessageCircle, User, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

interface RedPoint {
  id: number;
  location: string;
  description: string;
  timeRange: string;
  author: string; // cedula preferred
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

const mockRedPoints: RedPoint[] = [];

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

  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault();
    const dangerMap: Record<string, string> = { 'Alto': 'high', 'Medio': 'medium', 'Bajo': 'low' };
    const payload = {
      title: newPoint.location,
      description: newPoint.description,
      dangertime: newPoint.timeRange,
      dangerlevel: dangerMap[newPoint.riskLevel] || 'medium',
      date: new Date().toISOString(),
      author: user?.cedula || `${user?.name} ${user?.lastname}`
    };
    try {
      const res = await fetch('/api/security/hotspots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const created = await res.json();
        const riskBack: Record<string, RedPoint['riskLevel']> = { high: 'Alto', medium: 'Medio', low: 'Bajo' };
        const point: RedPoint = {
          id: (created._id?.toString?.() ?? created._id ?? Date.now()).toString() as any,
          location: created.title,
          description: created.description,
          timeRange: created.dangerTime || newPoint.timeRange,
          author: user?.cedula || `${user?.name} ${user?.lastname}`,
          date: new Date(created.date).toLocaleString('es-ES'),
          riskLevel: riskBack[(created.dangerLevel || '').toLowerCase()] || newPoint.riskLevel,
          comments: []
        };
        setRedPoints(prev => [point, ...prev]);
        setNewPoint({ location: '', description: '', timeRange: '', riskLevel: 'Medio' });
        setShowAddModal(false);
      }
    } catch {
      // swallow
    }
  };

  const handleAddComment = async (pointId: any) => {
    const commentText = newComment[pointId];
    if (!commentText?.trim()) return;
    try {
      const res = await fetch(`/api/security/hotspots/${pointId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText, author: user?.cedula || `${user?.name} ${user?.lastname}` })
      });
      if (res.ok) {
        const created = await res.json();
        const comment: Comment = {
          id: (created._id?.toString?.() ?? created._id ?? Date.now()).toString() as any,
          author: `${user?.name} ${user?.lastname}`,
          content: created.content,
          date: new Date(created.date).toLocaleString('es-ES')
        };
        setRedPoints(prev => prev.map(point =>
          point.id === pointId
            ? { ...point, comments: [...point.comments, comment] }
            : point
        ));
        setNewComment(prev => ({ ...prev, [pointId]: '' }));
      }
    } catch {
      // swallow
    }
  };

  useEffect(() => {
    // Load hotspots and comments
    fetch('/api/security/hotspots')
      .then(r => r.ok ? r.json() : [])
      .then(async (rows: any[]) => {
        if (!Array.isArray(rows)) return;
        // For each hotspot, load its comments
        const riskBack: Record<string, RedPoint['riskLevel']> = { high: 'Alto', medium: 'Medio', low: 'Bajo' };
        const points: RedPoint[] = await Promise.all(rows.map(async (h) => {
          const id = (h._id?.toString?.() ?? h._id ?? '').toString();
          let comments: Comment[] = [];
          try {
            const cr = await fetch(`/api/security/hotspots/${id}/comments`);
            if (cr.ok) {
              const crows = await cr.json();
              comments = (Array.isArray(crows) ? crows : []).map((c: any) => ({
                id: (c._id?.toString?.() ?? c._id ?? '').toString(),
                author: c.author || 'anon',
                content: c.content,
                date: new Date(c.date).toLocaleString('es-ES')
              }));
            }
          } catch {}
          return {
            id: id as any,
            location: h.title || 'Zona',
            description: h.description || '',
            timeRange: h.dangerTime || '',
            author: h.author || 'anon',
            date: new Date(h.date).toLocaleString('es-ES'),
            riskLevel: riskBack[(h.dangerLevel || '').toLowerCase()] || 'Medio',
            comments
          } as RedPoint;
        }));
        setRedPoints(points);
      })
      .catch(() => {});
  }, []);

  const canDeletePoint = (p: RedPoint) => !!user?.cedula && (p.author === user.cedula);
  const deletePoint = async (id: any) => {
    try { await fetch(`/api/security/hotspots/${id}`, { method: 'DELETE' }); } catch {}
    setRedPoints(prev => prev.filter(p => String(p.id) !== String(id)));
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
            {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Aquí puedes mantenerte al tanto sobre la seguridad del cantón.</p>
      </div>

      {/* Map Section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <section className="animate-fadeInUp mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-100 relative overflow-hidden">
            {/* Enhanced Realistic Map Background */}
            <div className="absolute inset-0">
              {/* Base map color */}
              <div className="w-full h-full bg-gradient-to-br from-green-100 via-blue-50 to-green-100"></div>
              
              {/* Streets and roads */}
              <div className="absolute inset-0">
                {/* Main horizontal roads */}
                <div className="absolute top-1/4 left-0 right-0 h-2 bg-gray-300 opacity-80 rounded-full"></div>
                <div className="absolute top-1/2 left-0 right-0 h-3 bg-gray-400 opacity-90 rounded-full"></div>
                <div className="absolute top-3/4 left-0 right-0 h-2 bg-gray-300 opacity-70 rounded-full"></div>
                
                {/* Vertical streets */}
                <div className="absolute top-0 bottom-0 left-1/4 w-2 bg-gray-300 opacity-80 rounded-full"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-gray-400 opacity-90 rounded-full"></div>
                <div className="absolute top-0 bottom-0 right-1/4 w-2 bg-gray-300 opacity-70 rounded-full"></div>
                
                {/* Buildings */}
                <div className="absolute top-4 left-4 w-6 h-6 bg-gray-200 rounded opacity-60 shadow-sm"></div>
                <div className="absolute top-8 right-6 w-4 h-8 bg-gray-300 rounded opacity-70 shadow-sm"></div>
                <div className="absolute bottom-12 left-8 w-8 h-4 bg-gray-200 rounded opacity-60 shadow-sm"></div>
                <div className="absolute bottom-6 right-8 w-6 h-6 bg-gray-300 rounded opacity-70 shadow-sm"></div>
                
                {/* Parks and green areas */}
                <div className="absolute top-6 right-12 w-10 h-10 bg-green-200 rounded-full opacity-60 shadow-sm"></div>
                <div className="absolute bottom-8 left-12 w-12 h-8 bg-green-200 rounded-lg opacity-60 shadow-sm"></div>
                
                {/* Water features */}
                <div className="absolute top-12 left-1/3 w-16 h-1 bg-blue-300 rounded-full opacity-70"></div>
              </div>
            </div>
            
            {/* Map content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">Alajuelita - Zonas de Riesgo</h3>
                <div className="bg-white px-2 py-1 rounded-full shadow-sm border">
                  <span className="text-xs font-medium text-blue-600">Mapa Interactivo</span>
                </div>
              </div>
              
              {/* Simulated map with danger points */}
              <div className="relative h-40 bg-white bg-opacity-30 rounded-lg border border-blue-200 backdrop-blur-sm">
                {/* Enhanced danger points with better positioning */}
                <div className="absolute top-3 left-6 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform duration-200" title="Parque Central - Alto Riesgo"></div>
                <div className="absolute top-8 right-8 w-4 h-4 bg-yellow-500 rounded-full animate-pulse shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform duration-200" title="Puente del Río - Riesgo Medio"></div>
                <div className="absolute bottom-6 left-1/2 w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform duration-200" title="Parada de Bus - Alto Riesgo"></div>
                <div className="absolute bottom-3 right-6 w-4 h-4 bg-orange-500 rounded-full animate-pulse shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform duration-200" title="Zona Comercial - Riesgo Medio"></div>
                <div className="absolute top-1/2 left-4 w-4 h-4 bg-yellow-500 rounded-full animate-pulse shadow-lg border-2 border-white cursor-pointer hover:scale-125 transition-transform duration-200" title="Escuela - Riesgo Bajo"></div>
                
                {/* User location indicator */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg animate-ping"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full"></div>
                </div>
                
                {/* Location labels */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <span className="text-xs text-blue-700 font-medium bg-white bg-opacity-80 px-2 py-1 rounded-full">Tu ubicación</span>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Legend */}
              <div className="flex items-center justify-between mt-3 text-xs bg-white bg-opacity-80 rounded-lg p-2 backdrop-blur-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-700 font-medium">Alto</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-700 font-medium">Medio</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-orange-700 font-medium">Bajo</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-700 font-medium">Tu ubicación</span>
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
                        
                        
                        <span>{point.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskLevelColor(point.riskLevel)}`}>
                      {point.riskLevel}
                    </span>
                    {canDeletePoint(point) && (
                      <button onClick={() => deletePoint(point.id)} className="text-red-600 hover:text-red-800 text-xs" title="Eliminar">Eliminar</button>
                    )}
                  </div>
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
                        {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
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