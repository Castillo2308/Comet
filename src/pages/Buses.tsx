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
    <div className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 min-h-screen">
      <UserProfileModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Header */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">Transporte Público</h1>
          <button
            onClick={() => setShowProfileModal(true)}
            className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95"
          >
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Información en tiempo real sobre rutas de autobuses en Alajuelita</p>
      </div>

      {/* Simulated Map Section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <section className="animate-fadeInUp mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-800">Mapa en Tiempo Real</h2>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">En vivo</span>
              </div>
              <button className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors duration-200">
                <Navigation className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            {/* Simulated Map */}
            <div className="w-full h-64 sm:h-80 bg-gradient-to-br from-green-100 via-blue-50 to-green-50 relative">
              {/* Grid pattern to simulate map */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-8 grid-rows-6 h-full">
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} className="border border-gray-300"></div>
                  ))}
                </div>
              </div>
              
              {/* Simulated roads */}
              <div className="absolute top-1/3 left-0 right-0 h-2 bg-gray-300 opacity-60"></div>
              <div className="absolute top-2/3 left-0 right-0 h-2 bg-gray-300 opacity-60"></div>
              <div className="absolute top-0 bottom-0 left-1/4 w-2 bg-gray-300 opacity-60"></div>
              <div className="absolute top-0 bottom-0 right-1/4 w-2 bg-gray-300 opacity-60"></div>
              
              {/* Animated bus markers */}
              {busRoutes.map((route, index) => (
                <div
                  key={route.id}
                  className={`absolute w-6 h-6 ${route.color} rounded-full flex items-center justify-center animate-pulse transform transition-all duration-1000`}
                  style={{
                    top: `${20 + (index * 15)}%`,
                    left: `${15 + (index * 20)}%`,
                    animation: `float 3s ease-in-out infinite ${index * 0.5}s`
                  }}
                >
                  <Bus className="h-3 w-3 text-white" />
                </div>
              ))}
              
              {/* Bus stops */}
              {busStops.map((stop, index) => (
                <div
                  key={index}
                  className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center"
                  style={{
                    top: `${25 + (index * 12)}%`,
                    left: `${30 + (index * 15)}%`
                  }}
                >
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              ))}
              
              {/* Location indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-ping"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Map legend */}
            <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-md p-2">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Tu ubicación</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500 border border-white rounded-full"></div>
                  <span>Paradas</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <Bus className="h-3 w-3 text-gray-600" />
                  <span>Autobuses</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Bus Tracking */}
        <section className="animate-fadeInUp mb-4" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Seguimiento en Vivo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {busRoutes.map((route, index) => (
              <div 
                key={route.id}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105 animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${route.color} animate-pulse`}></div>
                    <span className="font-semibold text-sm">{route.name}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                    {route.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-gray-600">Próximo: {route.nextArrival}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-green-600">Activo</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bus Routes Cards */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Rutas Disponibles</h2>
          <div className="space-y-3">
            {busRoutes.map((route, index) => (
              <div 
                key={route.id}
                className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`${route.color} p-2 rounded-lg transform transition-transform duration-200 hover:scale-110`}>
                    <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{route.name}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm">{route.destination}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                          {route.status}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Próximo: {route.nextArrival}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{route.frequency}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Route className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{route.stops} paradas</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">Disponible</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Horario: {route.operatingHours}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bus Stops */}
        <section className="animate-fadeInUp mt-4" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Paradas Principales</h2>
          <div className="space-y-2">
            {busStops.map((stop, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] animate-fadeInUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 bg-blue-100 rounded-full">
                      <MapPin className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{stop.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    {stop.routes.map((route) => (
                      <span 
                        key={route}
                        className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium transform transition-transform duration-200 hover:scale-110"
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

        {/* Quick Info */}
        <section className="animate-fadeInUp mt-4" style={{ animationDelay: '0.4s' }}>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm flex items-center">
              <Bus className="h-4 w-4 mr-2" />
              Información Importante
            </h3>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• Tarifa: ₡370 adultos, ₡185 estudiantes</li>
              <li>• Aceptamos tarjeta de transporte público</li>
              <li>• Frecuencia puede variar los fines de semana</li>
              <li>• Para emergencias: 911</li>
              <li>• Seguimiento GPS en tiempo real disponible</li>
            </ul>
          </div>
        </section>
      </div>

      <style jsx>{`
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
      `}</style>
    </div>
  );
}