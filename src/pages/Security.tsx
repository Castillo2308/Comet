import React from 'react';
import { Plus, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Security() {
  const { user } = useAuth();

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
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-white px-4 py-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-blue-600">Seguridad</h1>
          <button className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95">
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600">Aquí puedes conocer los puntos calientes del cantón.</p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Add Report Button */}
        <section className="animate-fadeInUp">
          <button className="w-full bg-blue-500 text-white py-4 px-6 rounded-2xl font-semibold text-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Añadir reporte</span>
          </button>
        </section>

        {/* Dangerous Zones */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Zonas peligrosas</h2>
          <div className="space-y-3">
            {dangerousZones.map((zone) => (
              <div 
                key={zone.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{zone.name}</h3>
                <p className="text-gray-600 text-sm mb-2">{zone.description}</p>
                <span className="text-gray-400 text-xs">{zone.date}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Latest News */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Últimas noticias</h2>
          <div className="space-y-3">
            {latestNews.map((news) => {
              const IconComponent = news.icon;
              return (
                <div 
                  key={news.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105"
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <IconComponent className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-medium">
                          {news.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{news.title}</h3>
                      <p className="text-gray-600 text-sm mb-2">{news.description}</p>
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