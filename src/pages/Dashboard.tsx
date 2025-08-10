import React, { useState } from 'react';
import { MapPin, MoreHorizontal, Calendar, Users, Shield, AlertTriangle, Clock, TrendingUp, Activity, Bell, CheckCircle } from 'lucide-react';
import UserProfileModal from '../components/UserProfileModal';
import { useAuth } from '../context/AuthContext';

const mockReports = [
  {
    id: 1,
    title: 'Basura en las calles',
    description: 'Durante estos días la acumulación de basura ha aumentado significativamente en la zona.',
    location: 'San Felipe',
    image: 'https://images.pexels.com/photos/2827392/pexels-photo-2827392.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=1',
    status: 'Pendiente',
    date: 'hace 2 horas',
    priority: 'Alta'
  }
];

const importantNews = [
  {
    id: 1,
    title: 'Corte de agua programado',
    description: 'El próximo martes 20 de febrero habrá corte de agua de 8:00 AM a 4:00 PM en el sector centro para mantenimiento de tuberías principales.',
    type: 'Servicios',
    date: 'hace 3 horas',
    icon: AlertTriangle,
    priority: 'high',
    status: 'urgent'
  },
  {
    id: 2,
    title: 'Nueva ruta de autobús',
    description: 'Se inaugura la nueva ruta 405 que conectará el centro con la zona industrial, mejorando la conectividad para trabajadores.',
    type: 'Transporte',
    date: 'hace 6 horas',
    icon: Users,
    priority: 'medium',
    status: 'info'
  },
  {
    id: 3,
    title: 'Feria de emprendedores',
    description: 'Este sábado 17 de febrero se realizará la feria mensual de emprendedores en el parque central de 9:00 AM a 5:00 PM.',
    type: 'Eventos',
    date: 'hace 1 día',
    icon: Calendar,
    priority: 'low',
    status: 'event'
  },
  {
    id: 4,
    title: 'Refuerzo de seguridad',
    description: 'La policía municipal aumentará las patrullas nocturnas en respuesta a reportes ciudadanos sobre actividad sospechosa.',
    type: 'Seguridad',
    date: 'hace 1 día',
    icon: Shield,
    priority: 'high',
    status: 'security'
  }
];

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

  // Combine mock reports with user reports
  const allReports = [...userReports, ...mockReports];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-gradient-to-r from-red-50 to-red-25';
      case 'medium': return 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-25';
      case 'low': return 'border-l-green-500 bg-gradient-to-r from-green-50 to-green-25';
      default: return 'border-l-blue-500 bg-gradient-to-r from-blue-50 to-blue-25';
    }
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
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-3 sm:px-4 py-3 sm:py-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white mb-1">¡Bienvenido, {user?.name}!</h1>
            <p className="text-blue-100 text-xs">Aquí puedes conocer más de tu cantón y mantenerte informado.</p>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-white bg-opacity-20 text-white w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        
        {/* Quick Stats in Header */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.id}
                className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-2 hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <IconComponent className="h-3 w-3 text-white" />
                  <span className="text-xs text-green-300 font-medium">{stat.change}</span>
                </div>
                <div className="text-sm font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-blue-100">{stat.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-3 sm:px-4 py-3 space-y-3">
        {/* Reports Section with Enhanced Design */}
        <section className="animate-fadeInUp">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-600" />
              Tus Reportes
            </h2>
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
              {allReports.length} activos
            </span>
          </div>
          
          <div className="space-y-3">
            {allReports.length > 0 ? (
              allReports.map((report, index) => (
                <div 
                  key={report.id} 
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={report.image}
                        alt={report.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0 transition-transform duration-300 hover:scale-110 shadow-md"
                      />
                      <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-sm">{report.title}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                            {report.status}
                          </span>
                          <button className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">{report.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-blue-500 text-xs font-medium bg-blue-50 px-2 py-1 rounded-lg">
                            <MapPin className="h-4 w-4 mr-1" />
                            {report.location}
                          </div>
                          <div className="flex items-center text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-lg">
                            <Clock className="h-4 w-4 mr-1" />
                            {report.date}
                          </div>
                        </div>
                        
                        {report.priority && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            report.priority === 'Alta' ? 'bg-red-100 text-red-600' :
                            report.priority === 'Media' ? 'bg-yellow-100 text-yellow-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {report.priority}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center border border-blue-200">
                <Activity className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-blue-800 mb-2">No tienes reportes aún</h3>
                <p className="text-blue-600">¡Usa el botón "+" para reportar tu primer problema!</p>
              </div>
            )}
          </div>
        </section>

        {/* Enhanced Important News Section */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 flex items-center">
              <Bell className="h-4 w-4 mr-2 text-blue-600" />
              Noticias Importantes
            </h2>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
              {importantNews.filter(n => n.priority === 'high').length} urgentes
            </span>
          </div>
          
          <div className="space-y-3">
            {importantNews.map((news, index) => {
              const IconComponent = news.icon;
              return (
                <div 
                  key={news.id}
                  className={`bg-white rounded-xl p-3 shadow-sm border-l-4 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp ${getPriorityColor(news.priority)}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-start space-x-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-gray-900 text-sm">{news.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${getTypeColor(news.type)}`}>
                          {news.type}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 text-xs mb-3 leading-relaxed">{news.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500 text-xs bg-gray-50 px-2 py-1 rounded-lg">
                          <Clock className="h-4 w-4 mr-1" />
                          {news.date}
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
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
            Resumen del Cantón
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            {quickStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={stat.id}
                  className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105 animate-fadeInUp hover-lift"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`bg-gradient-to-r ${getStatColor(stat.color)} p-3 rounded-xl shadow-lg`}>
                      <IconComponent className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-green-500 text-sm font-bold bg-green-50 px-2 py-1 rounded-full">
                      {stat.change}
                    </span>
                  </div>
                  
                  <div className="text-lg font-bold text-gray-900 mb-1">{stat.value}</div>
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