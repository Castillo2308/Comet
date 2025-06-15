import React, { useState } from 'react';
import { Plus, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

export default function Security() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const dangerousZones = [
    {
      id: 1,
      name: 'Parque Central',
      description: 'Las noches en este parque pueden ser un poco peligrosas.',
      date: '23 de abril de 2024'
    }
  ];

  const latestNews = [
    {
      id: 1,
      type: 'Policía',
      title: 'Robo en estanco',
      description: 'Esta mañana se reportó un robo en un estanco local.',
      date: '22 de abril de 2024',
      icon: Shield
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto pb-16 sm:pb-20 md:pb-24 min-h-screen">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Header */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">Seguridad</h1>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Aquí puedes conocer los puntos calientes del cantón.</p>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
        {/* Add Report Button */}
        <section className="animate-fadeInUp">
          <button className="w-full bg-blue-500 text-white py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Añadir reporte</span>
          </button>
        </section>

        {/* Dangerous Zones */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Zonas peligrosas</h2>
          <div className="space-y-2 sm:space-y-3">
            {dangerousZones.map((zone) => (
              <div 
                key={zone.id}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
              >
                <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{zone.name}</h3>
                <p className="text-gray-600 text-xs mb-2">{zone.description}</p>
                <span className="text-gray-400 text-xs">{zone.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Últimas noticias</h2>
          <div className="space-y-2 sm:space-y-3">
            {latestNews.map((news) => {
              const IconComponent = news.icon;
              return (
                <div 
                  key={news.id}
                  className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full transform transition-transform duration-200 hover:scale-110">
                      <IconComponent className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                          {news.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{news.title}</h3>
                      <p className="text-gray-600 text-xs mb-2">{news.description}</p>
                      <span className="text-gray-400 text-xs">{news.date}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}