import React, { useState } from 'react';
import { MapPin, MoreHorizontal, Calendar, Users, Shield, AlertTriangle, Clock } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';

const mockReports = [
  {
    id: 1,
    title: 'Basura en las calles',
    description: 'Durante estos días la acumulación de basura ha aumentado significativamente.',
    location: 'San Felipe',
    image: 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'Pendiente',
    date: 'hace 2 horas'
  }
];

const importantNews = [
  {
    id: 1,
    title: 'Corte de agua programado',
    description: 'El próximo martes 20 de febrero habrá corte de agua de 8:00 AM a 4:00 PM en el sector centro.',
    type: 'Servicios',
    date: 'hace 3 horas',
    icon: AlertTriangle,
    priority: 'high'
  },
  {
    id: 2,
    title: 'Nueva ruta de autobús',
    description: 'Se inaugura la nueva ruta 405 que conectará el centro con la zona industrial.',
    type: 'Transporte',
    date: 'hace 6 horas',
    icon: Users,
    priority: 'medium'
  },
  {
    id: 3,
    title: 'Feria de emprendedores',
    description: 'Este sábado 17 de febrero se realizará la feria mensual de emprendedores en el parque central.',
    type: 'Eventos',
    date: 'hace 1 día',
    icon: Calendar,
    priority: 'low'
  },
  {
    id: 4,
    title: 'Refuerzo de seguridad',
    description: 'La policía municipal aumentará las patrullas nocturnas en respuesta a reportes ciudadanos.',
    type: 'Seguridad',
    date: 'hace 1 día',
    icon: Shield,
    priority: 'high'
  }
];

export default function Dashboard() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { user } = useAuth();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Servicios': return 'bg-red-100 text-red-600';
      case 'Transporte': return 'bg-blue-100 text-blue-600';
      case 'Eventos': return 'bg-green-100 text-green-600';
      case 'Seguridad': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

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
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="flex items-start space-x-3">
                  <img
                    src={report.image}
                    alt={report.title}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover flex-shrink-0 transition-transform duration-300 hover:scale-110"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-xs sm:text-sm">{report.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className="bg-yellow-100 text-yellow-600 px-2 py-1 rounded-full text-xs font-medium">
                          {report.status}
                        </span>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full">
                          <MoreHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mb-2 line-clamp-2">{report.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-blue-500 text-xs font-medium">
                        <MapPin className="h-3 w-3 mr-1" />
                        {report.location}
                      </div>
                      <div className="flex items-center text-gray-400 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {report.date}
                      </div>
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
          <div className="space-y-3">
            {importantNews.map((news, index) => {
              const IconComponent = news.icon;
              return (
                <div 
                  key={news.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp ${getPriorityColor(news.priority)}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{news.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(news.type)}`}>
                          {news.type}
                        </span>
                      </div>
                      <p className="text-gray-700 text-xs mb-2">{news.description}</p>
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {news.date}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Resumen del Cantón</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">1,247</div>
                <div className="text-xs text-blue-700">Ciudadanos activos</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">89</div>
                <div className="text-xs text-green-700">Reportes resueltos</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-lg font-bold text-orange-600">12</div>
                <div className="text-xs text-orange-700">Eventos este mes</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">95%</div>
                <div className="text-xs text-purple-700">Satisfacción</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}