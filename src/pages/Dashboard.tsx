import React, { useState } from 'react';
import { MapPin, MoreHorizontal } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';

const mockReports = [
  {
    id: 1,
    title: 'Basura en las calles',
    description: 'Durante estos días la acumulación de basura ha aumentado significativamente.',
    location: 'San Felipe',
    image: 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'Otro'
  }
];

export default function Dashboard() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto pb-16 sm:pb-20 md:pb-24 min-h-screen">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Header */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">¡Bienvenido!</h1>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Aquí puedes conocer más de tu cantón.</p>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Reports Section */}
        <section className="animate-fadeInUp">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Tus reportes</h2>
          <div className="space-y-2 sm:space-y-3">
            {mockReports.map((report, index) => (
              <div 
                key={report.id} 
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover-lift"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={report.image}
                    alt={report.title}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{report.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                          {report.status}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{report.description}</p>
                    <div className="flex items-center text-blue-500 text-xs font-medium">
                      <MapPin className="h-3 w-3 mr-1" />
                      {report.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Important News Section */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Noticias importantes</h2>
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 text-center hover:shadow-md transition-all duration-300">
            <p className="text-gray-500 text-xs sm:text-sm">No hay noticias disponibles</p>
          </div>
        </section>
      </div>
    </div>
  );
}