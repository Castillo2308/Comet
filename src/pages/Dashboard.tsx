import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { MapPin, MoreHorizontal, Calendar, Users, Shield, AlertTriangle, Clock, Activity, Bell, Image as ImageIcon } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';

const mockReports: any[] = [];

const importantNews: any[] = [];

// quickStats removed per new dashboard design

export default function Dashboard({ userReports = [] }: { userReports?: any[] }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>(mockReports);
  const [news, setNews] = useState<any[]>(importantNews);
  const [showAllReports, setShowAllReports] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | string | null>(null);

  useEffect(() => {
    // Fetch user reports from backend
  api('/reports')
    .then(r => r.json())
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        const toEmbeddable = (url?: string) => {
          if (!url) return undefined;
          try {
            const raw = String(url);
            // Try extracting /d/<id> first
            const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
            let id = m?.[1];
            if (!id) {
           return `https://drive.google.com/thumbnail?id=${id}`;
            }
            if (id) return `https://drive.google.com/thumbnail?id=${id}`;
            return raw;
          } catch { return url; }
        };
        const mine = rows.filter(r => !user?.cedula || r.author === user?.cedula);
        const mapped = mine.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          location: r.location,
          photoLink: r.photo_link || undefined,
          image: toEmbeddable(r.photo_link) || 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          status: r.status === 'pending' ? 'Pendiente' : r.status,
          date: new Date(r.date).toLocaleString('es-ES'),
          priority: undefined
        }));
        setReports(mapped);
      }).catch(()=>{});
    // Fetch municipal news
  fetch('/api/news', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || ''}` } })
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        setNews(rows);
      }).catch(()=>{});
  }, [user?.cedula]);

  // Combine new reports from backend with any local pending user reports (from modal)
  const allReports = useMemo(() => {
    // Prefer unique by id; if local has same id, keep local first
    const map = new Map<string | number, any>();
    [...userReports, ...reports].forEach(r => {
      const key = r.id ?? `${r.title}-${r.date}`;
      if (!map.has(key)) map.set(key, r);
    });
    return Array.from(map.values());
  }, [userReports, reports]);
  const activeCount = allReports.filter(r => {
    const s = (r.status || '').toLowerCase();
    return s.includes('pend') || s.includes('proce');
  }).length;

  const getStatusPill = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('pend')) return 'from-yellow-400 to-yellow-500';
    if (s.includes('proce')) return 'from-blue-400 to-blue-500';
    if (s.includes('resuel') || s.includes('resol')) return 'from-green-400 to-green-500';
    if (s.includes('rechaz')) return 'from-red-400 to-red-500';
    return 'from-gray-400 to-gray-500';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Servicios': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'Transporte': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'Eventos': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'Seguridad': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };


  const handleDeleteReport = async (id: number | string) => {
    try {
      const res = await api(`/reports/${id}` , { method: 'DELETE' });
      if (!res.ok) return;
      // Refresh from server to avoid stale view when filters/sorting apply
      setReports(prev => prev.filter(r => r.id !== id));
      try {
        const rr = await api('/reports');
        const rows: any[] = await rr.json();
        const mine = rows.filter(r => !user?.cedula || r.author === user?.cedula);
        const toEmbeddable = (url?: string) => {
          if (!url) return undefined;
          try {
            const raw = String(url);
            const m = raw.match(/\/d\/([a-zA-Z0-9_-]+)/);
            let id = m?.[1];
            if (!id) {
           return `https://drive.google.com/thumbnail?id=${id}`;
            }
            if (id) return `https://drive.google.com/thumbnail?id=${id}`;
            return raw;
          } catch { return url; }
        };
        setReports(mine.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          location: r.location,
          photoLink: r.photo_link || undefined,
          image: toEmbeddable(r.photo_link) || 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          status: r.status === 'pending' ? 'Pendiente' : r.status,
          date: new Date(r.date).toLocaleString('es-ES'),
          priority: undefined
        })));
      } catch {}
      setMenuOpenId(null);
    } catch {
      // Optional: toast error
    }
  };

  // removed getStatColor; not used in new layout

  return (
    <div className="flex-1 overflow-y-auto pb-16 sm:pb-20 md:pb-24 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Banner de paisaje del cantón (bubble style) */}
      <div className="relative shadow-xl rounded-2xl overflow-hidden mx-3 sm:mx-4 mt-3 sm:mt-4">
        <img
          src="/landscape.png"
          alt="Paisaje del cantón"
          className="w-full h-40 sm:h-56 object-cover filter brightness-[.55]"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.pexels.com/photos/325185/pexels-photo-325185.jpeg?auto=compress&cs=tinysrgb&w=1200'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent"></div>
  <div className="absolute top-4 sm:top-5 left-3 flex items-center gap-3">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-lg flex items-center justify-center p-2">
            <img src="/municipality-logo.svg" alt="Municipalidad Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white drop-shadow">¡Bienvenido, {user?.name}!</h1>
            <p className="text-white/90 text-xs sm:text-sm drop-shadow">Conoce tu cantón y mantente informado.</p>
          </div>
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="absolute top-2 right-3 bg-white/80 text-gray-900 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-sm backdrop-blur-sm hover:bg-white transition-all duration-200 shadow-lg"
        >
          {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
        </button>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4">
        {/* Reports Section with Enhanced Design */}
        <section className="animate-fadeInUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Tus Reportes
            </h2>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              {activeCount} activos
            </span>
          </div>
          
          <div className="space-y-4">
            {allReports.length > 0 ? (
              (showAllReports ? allReports : allReports.slice(0,5)).map((report, index) => (
                <div 
                  key={report.id} 
                  className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      {report.photoLink ? (
                        <a
                          href={report.photoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 shadow-md border"
                          title="Abrir imagen en nueva pestaña"
                        >
                          <ImageIcon className="h-6 w-6" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shadow-md border">
                          <ImageIcon className="h-6 w-6" />
                        </div>
                      )}
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{report.title}</h3>
                        <div className="flex items-center space-x-2 relative">
                          <span className={`bg-gradient-to-r ${getStatusPill(report.status)} text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm`}>
                            {report.status}
                          </span>
                          <button onClick={() => setMenuOpenId(menuOpenId === report.id ? null : report.id)} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuOpenId === report.id && (
                            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-36">
                              <button onClick={() => handleDeleteReport(report.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 text-red-600">Eliminar</button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{report.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-blue-500 text-sm font-medium bg-blue-50 px-3 py-1 rounded-lg">
                            <MapPin className="h-4 w-4 mr-1" />
                            {report.location}
                          </div>
                          <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-lg">
                            <Clock className="h-4 w-4 mr-1" />
                            {report.date}
                          </div>
                        </div>
                        
                        
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center border border-blue-200">
                <Activity className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-800 mb-2">No tienes reportes aún</h3>
                <p className="text-blue-600">¡Usa el botón "+" para reportar tu primer problema!</p>
              </div>
            )}
          </div>
          {allReports.length > 5 && (
            <div className="flex justify-center pt-2">
              <button onClick={() => setShowAllReports(!showAllReports)} className="text-blue-600 text-sm hover:underline">
                {showAllReports ? 'Ver menos' : 'Ver más'}
              </button>
            </div>
          )}
        </section>

        {/* Noticias Importantes (mostrar todas) */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-600" />
              Noticias Importantes
            </h2>
   
          </div>
          
          <div className="space-y-4">
            {(news || []).map((news, index) => {
              const type = (news.type || '').toLowerCase();
              const IconComponent = type.includes('seguridad') ? Shield : type.includes('transporte') ? Users : type.includes('event') ? Calendar : AlertTriangle;
              return (
                <div 
                  key={news.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp ${news.insurgent ? 'border-l-red-500 bg-gradient-to-r from-red-50 to-red-25' : 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-25'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="bg-white p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">{news.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getTypeColor(news.type)}`}>
                          {news.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 text-sm mb-3 leading-relaxed">{news.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-3 py-1 rounded-lg">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(news.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' })}
                        </div>
                        
                        {news.priority === 'high' && (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                            URGENTE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Removed Noticias de Seguridad section per request */}
      </div>
    </div>
  );
}