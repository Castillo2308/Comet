import React, { useEffect, useRef, useState } from 'react';
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
  { name: 'Terminal Central', routes: ['401', '402', '403'], lat: 9.9281, lng: -84.0907 },
  { name: 'Parque Central', routes: ['401', '403'], lat: 9.9285, lng: -84.0912 },
  { name: 'Hospital Nacional', routes: ['404'], lat: 9.9290, lng: -84.0920 },
  { name: 'Centro Comercial', routes: ['401', '402'], lat: 9.9275, lng: -84.0900 },
  { name: 'Escuela Principal', routes: ['403', '404'], lat: 9.9295, lng: -84.0925 }
];

export default function Buses() {
  const { user } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);

  useEffect(() => {
    // Initialize Leaflet map
    const initMap = async () => {
      if (typeof window !== 'undefined' && mapRef.current) {
        // Dynamically import Leaflet to avoid SSR issues
        const L = (await import('leaflet')).default;
        
        // Create map centered on Alajuelita
        const map = L.map(mapRef.current).setView([9.9281, -84.0907], 15);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        // Add bus stops markers
        busStops.forEach((stop, index) => {
          const marker = L.marker([stop.lat, stop.lng]).addTo(map);
          marker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${stop.name}</h3>
              <p class="text-xs text-gray-600">Rutas: ${stop.routes.join(', ')}</p>
            </div>
          `);
        });

        // Add animated bus markers
        busRoutes.forEach((route, index) => {
          const busIcon = L.divIcon({
            html: `<div class="w-6 h-6 ${route.color} rounded-full flex items-center justify-center animate-pulse">
                     <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                       <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                       <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1V8a1 1 0 00-1-1h-3z"/>
                     </svg>
                   </div>`,
            className: 'bus-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          // Random position near Alajuelita for demo
          const lat = 9.9281 + (Math.random() - 0.5) * 0.01;
          const lng = -84.0907 + (Math.random() - 0.5) * 0.01;
          
          const busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(map);
          busMarker.bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold text-sm">${route.name}</h3>
              <p class="text-xs text-gray-600">${route.destination}</p>
              <p class="text-xs text-green-600">Próxima llegada: ${route.nextArrival}</p>
            </div>
          `);
        });

        return () => {
          map.remove();
        };
      }
    };

    initMap();
  }, []);

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

      {/* Real Map Section */}
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
            {/* Map Container */}
            <div 
              ref={mapRef} 
              className="w-full h-64 sm:h-80 bg-gray-100"
              style={{ minHeight: '300px' }}
            />
            
            {/* Map Overlay Controls */}
            <div className="absolute top-3 left-3 bg-white rounded-lg shadow-md p-2">
              <div className="flex flex-col space-y-1">
                {busRoutes.map((route) => (
                  <button
                    key={route.id}
                    onClick={() => setSelectedRoute(selectedRoute === route.id ? null : route.id)}
                    className={`flex items-center space-x-2 px-2 py-1 rounded text-xs transition-all duration-200 transform hover:scale-105 ${
                      selectedRoute === route.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full ${route.color}`}></div>
                    <span className="font-medium">{route.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Loading indicator for map */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <span className="text-sm text-gray-600">Cargando mapa...</span>
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

      {/* Add Leaflet CSS */}
      <link 
        rel="stylesheet" 
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <script 
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
      ></script>
    </div>
  );
}