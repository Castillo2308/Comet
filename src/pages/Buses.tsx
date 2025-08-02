import React, { useState } from 'react';
import { Bus, Clock, MapPin, Route, Users, Navigation, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from '../components/UserProfileModal';

const busRoutes = [
  {
    id: 1,
    name: 'Ruta 401',
    destination: 'San José - Alajuelita',
    frequency: '15 min',
    operatingHours: '5:00 AM - 10:00 PM',
    stops: 12,
    color: 'bg-blue-500',
    nextArrival: '8 min',
    status: 'En ruta'
  },
  {
    id: 2,
    name: 'Ruta 402',
    destination: 'Desamparados - Alajuelita',
    frequency: '20 min',
    operatingHours: '5:30 AM - 9:30 PM',
    stops: 8,
    color: 'bg-green-500',
    nextArrival: '12 min',
    status: 'En ruta'
  },
  {
    id: 3,
    name: 'Ruta 403',
    destination: 'Circuito Interno',
    frequency: '25 min',
    operatingHours: '6:00 AM - 8:00 PM',
    stops: 15,
    color: 'bg-orange-500',
    nextArrival: '5 min',
    status: 'Próximo'
  },
  {
    id: 4,
    name: 'Ruta 404',
    destination: 'Hospital - Centro',
    frequency: '30 min',
    operatingHours: '6:00 AM - 7:00 PM',
    stops: 6,
    color: 'bg-red-500',
    nextArrival: '18 min',
    status: 'En ruta'
  }
];

const busStops = [
  { name: 'Terminal Central', routes: ['401', '402', '403'] },
  { name: 'Parque Central', routes: ['401', '403'] },
  { name: 'Hospital Nacional', routes: ['404'] },
  { name: 'Centro Comercial', routes: ['401', '402'] },
  { name: 'Escuela Principal', routes: ['403', '404'] }
];

export default function Buses() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Próximo': return 'text-green-600 bg-green-100';
      case 'En ruta': return 'text-blue-600 bg-blue-100';
      case 'Retrasado': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-3 sm:px-4 py-4 sm:py-6 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-3 rounded-full backdrop-blur-sm">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Transporte Público</h1>
              <p className="text-blue-100 text-sm">Sistema integrado de rutas</p>
            </div>
          </div>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-white bg-opacity-20 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-sm backdrop-blur-sm hover:bg-opacity-30 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-blue-100 text-sm">Información en tiempo real sobre rutas de autobuses en Alajuelita</p>
      </div>

      {/* Enhanced Map Section */}
      <div className="px-3 sm:px-4 py-4 sm:py-6">
        <section className="animate-fadeInUp mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-blue-600" />
              Mapa en Tiempo Real
            </h2>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">En vivo</span>
              </div>
              <button className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                <Navigation className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-xl bg-white">
            {/* Enhanced Realistic Map */}
            <div className="w-full h-80 sm:h-96 bg-gradient-to-br from-green-100 via-blue-50 to-green-50 relative overflow-hidden">
              {/* Realistic street grid */}
              <div className="absolute inset-0">
                {/* Main roads */}
                <div className="absolute top-1/4 left-0 right-0 h-3 bg-gray-400 opacity-80 rounded-full"></div>
                <div className="absolute top-1/2 left-0 right-0 h-4 bg-gray-500 opacity-90 rounded-full"></div>
                <div className="absolute top-3/4 left-0 right-0 h-2 bg-gray-300 opacity-70 rounded-full"></div>
                
                {/* Vertical streets */}
                <div className="absolute top-0 bottom-0 left-1/4 w-3 bg-gray-400 opacity-80 rounded-full"></div>
                <div className="absolute top-0 bottom-0 left-1/2 w-4 bg-gray-500 opacity-90 rounded-full"></div>
                <div className="absolute top-0 bottom-0 right-1/4 w-2 bg-gray-300 opacity-70 rounded-full"></div>
                
                {/* Buildings simulation */}
                <div className="absolute top-6 left-6 w-8 h-8 bg-gray-300 rounded opacity-60"></div>
                <div className="absolute top-12 right-8 w-6 h-10 bg-gray-400 rounded opacity-70"></div>
                <div className="absolute bottom-16 left-12 w-10 h-6 bg-gray-300 rounded opacity-60"></div>
                <div className="absolute bottom-8 right-12 w-8 h-8 bg-gray-400 rounded opacity-70"></div>
                
                {/* Parks/green areas */}
                <div className="absolute top-8 right-16 w-12 h-12 bg-green-300 rounded-full opacity-50"></div>
                <div className="absolute bottom-12 left-16 w-16 h-10 bg-green-300 rounded-lg opacity-50"></div>
              </div>
              
              {/* Enhanced animated bus markers */}
              {busRoutes.map((route, index) => (
                <div
                  key={route.id}
                  className={`absolute w-8 h-8 ${route.color} rounded-lg flex items-center justify-center shadow-lg transform transition-all duration-1000 hover:scale-125 cursor-pointer`}
                  style={{
                    top: `${20 + (index * 15)}%`,
                    left: `${15 + (index * 20)}%`,
                    animation: `busMove 8s ease-in-out infinite ${index * 2}s, float 3s ease-in-out infinite ${index * 0.5}s`
                  }}
                >
                  <Bus className="h-4 w-4 text-white" />
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {route.name} - {route.nextArrival}
                  </div>
                </div>
              ))}
              
              {/* Enhanced bus stops */}
              {busStops.map((stop, index) => (
                <div
                  key={index}
                  className="absolute w-6 h-6 bg-white border-3 border-blue-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer"
                  style={{
                    top: `${25 + (index * 12)}%`,
                    left: `${30 + (index * 15)}%`
                  }}
                >
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {stop.name}
                  </div>
                </div>
              ))}
              
              {/* User location indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg animate-ping"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              
              {/* Route lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.6"/>
                    <stop offset="50%" stopColor="#10B981" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.6"/>
                  </linearGradient>
                </defs>
                <path
                  d="M 50 100 Q 200 50 350 150 T 600 200"
                  stroke="url(#routeGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="10,5"
                  className="animate-pulse"
                />
              </svg>
            </div>
            
            {/* Enhanced map legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-3 backdrop-blur-sm bg-opacity-95">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
                  <span className="font-medium">Tu ubicación</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
                  <span className="font-medium">Paradas</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
                    <Bus className="h-2 w-2 text-white" />
                  </div>
                  <span className="font-medium">Autobuses</span>
                </div>
              </div>
            </div>
            
            {/* Live tracking indicator */}
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span>Seguimiento GPS</span>
            </div>
          </div>
        </section>

        {/* Live Bus Tracking */}
        <section className="animate-fadeInUp mb-6" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Seguimiento en Vivo
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {busRoutes.map((route, index) => (
              <div 
                key={route.id}
                className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-fadeInUp hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${route.color} animate-pulse shadow-lg`}></div>
                    <span className="font-bold text-gray-900">{route.name}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(route.status)} shadow-sm`}>
                    {route.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-700 font-medium">Próximo: {route.nextArrival}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600 font-medium">Activo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Bus Routes Cards */}
        <section className="animate-fadeInUp mb-6" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Route className="h-5 w-5 mr-2 text-blue-600" />
            Rutas Disponibles
          </h2>
          <div className="space-y-4">
            {busRoutes.map((route, index) => (
              <div 
                key={route.id}
                className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start space-x-4">
                  <div className={`${route.color} p-3 rounded-xl transform transition-transform duration-200 hover:scale-110 hover:rotate-3 shadow-lg`}>
                    <Bus className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{route.name}</h3>
                        <p className="text-gray-600 text-sm">{route.destination}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(route.status)} shadow-sm`}>
                          {route.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Próximo: {route.nextArrival}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="text-gray-700 font-medium">{route.frequency}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <Route className="h-4 w-4 text-green-500" />
                        <span className="text-gray-700 font-medium">{route.stops} paradas</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg">
                        <Users className="h-4 w-4 text-orange-500" />
                        <span className="text-gray-700 font-medium">Disponible</span>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800 font-medium">
                        Horario: {route.operatingHours}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Bus Stops */}
        <section className="animate-fadeInUp mb-6" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-red-500" />
            Paradas Principales
          </h2>
          <div className="space-y-3">
            {busStops.map((stop, index) => (
              <div 
                key={index}
                className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp hover-lift"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <MapPin className="h-5 w-5 text-blue-500" />
                    </div>
                    <span className="font-bold text-gray-900">{stop.name}</span>
                  </div>
                  <div className="flex space-x-2">
                    {stop.routes.map((route) => (
                      <span 
                        key={route}
                        className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold transform transition-transform duration-200 hover:scale-110 shadow-lg"
                      >
                        {route}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Enhanced Quick Info */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 border border-blue-200 shadow-xl">
            <h3 className="font-bold text-white mb-4 text-lg flex items-center">
              <Bus className="h-5 w-5 mr-2" />
              Información Importante
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-100">
              <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                <p className="font-semibold">• Tarifa: ₡370 adultos, ₡185 estudiantes</p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                <p className="font-semibold">• Aceptamos tarjeta de transporte público</p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                <p className="font-semibold">• Frecuencia puede variar los fines de semana</p>
              </div>
              <div className="bg-white bg-opacity-10 p-3 rounded-lg backdrop-blur-sm">
                <p className="font-semibold">• Seguimiento GPS en tiempo real disponible</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes busMove {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          25% { transform: translateX(20px) translateY(-10px); }
          50% { transform: translateX(40px) translateY(5px); }
          75% { transform: translateX(20px) translateY(10px); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .hover-lift:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}