import { useEffect, useMemo, useState } from 'react';
import { MapPin, MoreHorizontal, Calendar, Users, Shield, AlertTriangle, Clock, TrendingUp, Activity, Bell, CheckCircle } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';

const mockReports: any[] = [];

const importantNews: any[] = [];

const quickStats = [
  {
    id: 1,
    title: 'Ciudadanos Activos',
    value: '1,247',
    change: '+12%',
    trend: 'up',
    icon: Users,
    color: 'blue',
    description: 'Usuarios registrados este mes'
  },
  {
    id: 2,
    title: 'Reportes Resueltos',
    value: '89',
    change: '+8%',
    trend: 'up',
    icon: CheckCircle,
    color: 'green',
    description: 'Problemas solucionados'
  },
  {
    id: 3,
    title: 'Eventos Programados',
    value: '12',
    change: '+3',
    trend: 'up',
    icon: Calendar,
    color: 'orange',
    description: 'Actividades este mes'
  },
  {
    id: 4,
    title: 'Satisfacción',
    value: '95%',
    change: '+2%',
    trend: 'up',
    icon: TrendingUp,
    color: 'purple',
    description: 'Calificación ciudadana'
  }
];

export default function Dashboard({ userReports = [] }: { userReports?: any[] }) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>(mockReports);
  const [news, setNews] = useState<any[]>(importantNews);
  const [showAllReports, setShowAllReports] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<number | string | null>(null);

  useEffect(() => {
    // Fetch user reports from backend
    fetch('/api/reports')
      .then(r => r.ok ? r.json() : [])
      .then((rows: any[]) => {
        if (!Array.isArray(rows)) return;
        const mine = rows.filter(r => !user?.cedula || r.author === user?.cedula);
        const mapped = mine.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          location: r.location,
          image: r.photo_link || 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
          status: r.status === 'pending' ? 'Pendiente' : r.status,
          date: new Date(r.date).toLocaleString('es-ES'),
          priority: undefined
        }));
        setReports(mapped);
      }).catch(()=>{});
    // Fetch municipal news
    fetch('/api/news')
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

  const canDelete = (report: any) => {
    // Owned by current user if author matches cedula in either raw or formatted form
    return !user?.cedula || report.author === user?.cedula;
  };

  const handleDeleteReport = async (id: number | string) => {
    try {
      const res = await fetch(`/api/reports/${id}` , { method: 'DELETE' });
      if (!res.ok) return;
      setReports(prev => prev.filter(r => r.id !== id));
      setMenuOpenId(null);
    } catch {
      // Optional: toast error
    }
  };

  const getStatColor = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'orange': return 'from-orange-500 to-orange-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-16 sm:pb-20 md:pb-24 min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-3 sm:px-4 py-4 sm:py-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white mb-1">¡Bienvenido, {user?.name}!</h1>
            <p className="text-blue-100 text-xs sm:text-sm">Aquí puedes conocer más de tu cantón y mantenerte informado.</p>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-white bg-opacity-20 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg"
          >
            {user?.name?.charAt(0)}{user?.lastname?.charAt(0)}
          </button>
        </div>
        
        {/* Quick Stats in Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.id}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-2 sm:p-3 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  <span className="text-xs text-green-300 font-medium">{stat.change}</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-blue-100">{stat.title}</div>
              </div>
            );
          })}
        </div>
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
                      <img
                        src={report.image}
                        alt={report.title}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0 transition-transform duration-300 hover:scale-110 shadow-md"
                      />
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
                              <button
                                disabled={!canDelete(report)}
                                onClick={() => canDelete(report) && handleDeleteReport(report.id)}
                                className={`w-full text-left px-3 py-2 text-sm ${canDelete(report) ? 'hover:bg-gray-50 text-red-600' : 'text-gray-300 cursor-not-allowed'}`}
                              >
                                Eliminar
                              </button>
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

        {/* Enhanced Important News Section */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-blue-600" />
              Noticias Importantes
            </h2>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              {importantNews.filter(n => n.priority === 'high').length} urgentes
            </span>
          </div>
          
          <div className="space-y-4">
            {news.map((news, index) => {
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

        {/* Enhanced Quick Stats */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Resumen del Cantón
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={stat.id}
                  className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105 animate-fadeInUp hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className={`bg-gradient-to-r ${getStatColor(stat.color)} p-3 rounded-xl shadow-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-green-500 text-sm font-bold bg-green-50 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-sm font-medium text-gray-700 mb-1">{stat.title}</div>
                  <div className="text-xs text-gray-500">{stat.description}</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}