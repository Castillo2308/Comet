import React from 'react';
import { Bus, Clock, MapPin, Route, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const busRoutes = [
  {
    id: 1,
    name: 'Ruta 401',
    destination: 'San José - Alajuelita',
    frequency: '15 min',
    operatingHours: '5:00 AM - 10:00 PM',
    stops: 12,
    color: 'bg-blue-500'
  },
  {
    id: 2,
    name: 'Ruta 402',
    destination: 'Desamparados - Alajuelita',
    frequency: '20 min',
    operatingHours: '5:30 AM - 9:30 PM',
    stops: 8,
    color: 'bg-green-500'
  },
  {
    id: 3,
    name: 'Ruta 403',
    destination: 'Circuito Interno',
    frequency: '25 min',
    operatingHours: '6:00 AM - 8:00 PM',
    stops: 15,
    color: 'bg-orange-500'
  },
  {
    id: 4,
    name: 'Ruta 404',
    destination: 'Hospital - Centro',
    frequency: '30 min',
    operatingHours: '6:00 AM - 7:00 PM',
    stops: 6,
    color: 'bg-purple-500'
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

  return (
    <div className="flex-1 overflow-y-auto pb-20 sm:pb-24 md:pb-28 min-h-screen">
      {/* Header */}
      <div className="bg-white px-3 sm:px-4 py-3 sm:py-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-blue-600">Transporte Público</h1>
          <button className="bg-blue-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-semibold text-xs sm:text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95">
            {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
          </button>
        </div>
        <p className="text-gray-600 text-xs sm:text-sm">Información sobre rutas de autobuses en Alajuelita</p>
      </div>

      {/* Map Section */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
        <section className="animate-fadeInUp mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Mapa de Rutas</h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 relative overflow-hidden">
            {/* Simulated map background */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full bg-gradient-to-br from-green-400 via-blue-400 to-purple-400"></div>
            </div>
            
            {/* Map content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Alajuelita - Rutas de Autobuses</h3>
                <div className="bg-white px-3 py-1 rounded-full shadow-sm">
                  <span className="text-xs font-medium text-gray-600">En vivo</span>
                </div>
              </div>
              
              {/* Route indicators */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {busRoutes.map((route) => (
                  <div key={route.id} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${route.color}`}></div>
                    <span className="text-xs font-medium text-gray-700">{route.name}</span>
                  </div>
                ))}
              </div>
              
              {/* Simulated map elements */}
              <div className="relative h-32 bg-white bg-opacity-50 rounded-lg border border-gray-200">
                <div className="absolute top-2 left-2 bg-red-500 w-2 h-2 rounded-full animate-pulse"></div>
                <div className="absolute top-4 right-4 bg-blue-500 w-2 h-2 rounded-full animate-pulse"></div>
                <div className="absolute bottom-3 left-1/2 bg-green-500 w-2 h-2 rounded-full animate-pulse"></div>
                <div className="absolute bottom-2 right-2 bg-orange-500 w-2 h-2 rounded-full animate-pulse"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">Mapa Interactivo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bus Routes Cards */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Rutas Disponibles</h2>
          <div className="space-y-3">
            {busRoutes.map((route, index) => (
              <div 
                key={route.id}
                className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start space-x-3">
                  <div className={`${route.color} p-2 rounded-lg`}>
                    <Bus className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{route.name}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm">{route.destination}</p>
                      </div>
                      <span className="bg-green-100 text-green-600 px-2 py-1 rounded-full text-xs font-medium">
                        Activo
                      </span>
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
        <section className="animate-fadeInUp mt-4" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3">Paradas Principales</h2>
          <div className="space-y-2">
            {busStops.map((stop, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-900 text-sm">{stop.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    {stop.routes.map((route) => (
                      <span 
                        key={route}
                        className="bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-medium"
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
        <section className="animate-fadeInUp mt-4" style={{ animationDelay: '0.3s' }}>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="font-semibold text-blue-900 mb-2 text-sm">Información Importante</h3>
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• Tarifa: ₡370 adultos, ₡185 estudiantes</li>
              <li>• Aceptamos tarjeta de transporte público</li>
              <li>• Frecuencia puede variar los fines de semana</li>
              <li>• Para emergencias: 911</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}