import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Mostrar splash por 2.5 segundos en app o web
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Esperar animación de fade
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 z-[9999] flex items-center justify-center ${
      !isVisible ? 'animate-fadeOut' : 'animate-fadeIn'
    }`}>
      <div className="flex flex-col items-center justify-center space-y-4">
        {/* Logo Animado */}
        <div className="animate-pulse-scale">
          <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
            <img 
              src="/pwa-512x512.png" 
              alt="COMET Logo" 
              className="w-24 h-24 object-contain animate-bounce-subtle"
            />
          </div>
        </div>

        {/* Nombre de la app */}
        <div className="text-center mt-4">
          <h1 className="text-3xl font-bold text-white animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            COMET
          </h1>
          <p className="text-blue-100 text-sm mt-2 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
            Sistema de Gestión Municipal
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1 bg-white/20 rounded-full mt-8 overflow-hidden">
          <div className="h-full bg-white animate-loading-bar"></div>
        </div>
      </div>
    </div>
  );
}
