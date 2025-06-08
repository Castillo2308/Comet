import React from 'react';
import { MapPin, Bus, Mountain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Announcements() {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto pb-20">
      {/* Header with background image */}
      <div 
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/1563356/pexels-photo-1563356.jpeg?auto=compress&cs=tinysrgb&w=800&h=400&dpr=1)'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative z-10 p-6 h-full flex flex-col justify-center">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">¡Descubre!</h1>
              <p className="text-white text-sm opacity-90">
                Aquí puedes conocer más de tu cantón.
              </p>
            </div>
            <button className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm hover:bg-blue-600 transition-all duration-200 transform hover:scale-110 active:scale-95">
              {user?.name?.charAt(0)}{user?.lastName?.charAt(0)}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* What do you want to know section */}
        <section className="animate-fadeInUp">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">¿Qué deseas conocer?</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500 text-white p-4 rounded-2xl hover:bg-green-600 transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Parques</h3>
              <p className="text-sm opacity-90">Ubicación de ruta uu cantón.</p>
            </div>
            <div className="bg-gray-400 text-white p-4 rounded-2xl hover:bg-gray-500 transition-all duration-300 transform hover:scale-105 cursor-pointer">
              <h3 className="font-semibold text-lg mb-2">Servicios</h3>
              <p className="text-sm opacity-90">Comicios municipales disponibles.</p>
            </div>
          </div>
        </section>

        {/* Did you know section */}
        <section className="animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">¿Sabías qué...</h2>
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Bus className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">30 autobuses transitan</h3>
                  <p className="text-gray-600 text-sm">diariamente por el cantón.</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-100 p-3 rounded-full">
                  <Mountain className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">La montaña más alta</h3>
                  <p className="text-gray-600 text-sm">está a 2050 MSNM.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}