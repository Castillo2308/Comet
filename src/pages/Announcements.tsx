import { useEffect, useState } from 'react';
import { Bus, Mountain, Megaphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

export default function Announcements() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [news, setNews] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/news')
      .then(r => r.ok ? r.json() : [])
      .then((rows) => {
        if (Array.isArray(rows)) setNews(rows);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 overflow-y-auto pb-16 sm:pb-20 md:pb-24 min-h-screen">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Header - standardized to Buses style */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-5 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Anuncios</h1>
              <p className="text-blue-100 text-sm">Novedades y avisos del cantón</p>
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

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* What do you want to know section */}
        <section className="animate-fadeInUp">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">¿Qué deseas conocer?</h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-green-500 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-green-600 transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <h3 className="font-semibold text-sm sm:text-base mb-1">Parques</h3>
              <p className="text-xs sm:text-sm opacity-90">Ubicación de ruta uu cantón.</p>
            </div>
            <div className="bg-gray-400 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl hover:bg-gray-500 transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <h3 className="font-semibold text-sm sm:text-base mb-1">Servicios</h3>
              <p className="text-xs sm:text-sm opacity-90">Comicios municipales disponibles.</p>
            </div>
          </div>
        </section>

        {/* Municipal news */}
        <section className="animate-fadeInUp">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100">Anuncios Municipales</h2>
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300">
              Urgentes: {news.filter(n => n.insurgent).length}
            </span>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {(showAll ? news : news.slice(0, 5)).map((n, idx) => (
              <div
                key={n.id ?? idx}
                className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-full transform transition-transform duration-200 hover:scale-110 bg-blue-100 dark:bg-blue-900/40">
                    <Megaphone className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {n.type && (
                        <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">{n.type}</span>
                      )}
                      {n.insurgent ? (
                        <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">Urgente</span>
                      ) : null}
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-xs sm:text-sm mb-1">{n.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs mb-2">{n.description}</p>
                    <div className="text-gray-400 dark:text-gray-400 text-[11px]">{new Date(n.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
                  </div>
                </div>
              </div>
            ))}
            {news.length === 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">Aún no hay anuncios publicados.</div>
            )}
            {news.length > 5 && (
              <div className="flex justify-center pt-1">
                <button onClick={() => setShowAll(!showAll)} className="text-blue-600 dark:text-blue-400 text-xs hover:underline">
                  {showAll ? 'Ver menos' : 'Ver más'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Did you know section */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">¿Sabías qué...</h2>
          <div className="space-y-2 sm:space-y-3">
            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-full transform transition-transform duration-200 hover:scale-110">
                  <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">30 autobuses transitan</h3>
                  <p className="text-gray-600 text-xs">diariamente por el cantón.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-2 rounded-full transform transition-transform duration-200 hover:scale-110">
                  <Mountain className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">La montaña más alta</h3>
                  <p className="text-gray-600 text-xs">está a 2050 MSNM.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}