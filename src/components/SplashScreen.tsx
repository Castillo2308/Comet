import { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Mostrar splash por 3.5 segundos total (1.5s zoom cometa + 1.5s carga + 0.5s fade)
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Esperar animación de fade
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 z-[9999] flex flex-col items-center justify-center overflow-hidden ${
      !isVisible ? 'animate-fadeOut' : ''
    }`}>
      {/* Logo del cometa haciéndose grande desde el centro */}
      <div className="animate-comet-zoom">
        <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm transform drop-shadow-2xl">
          <img 
            src="/pwa-512x512.png" 
            alt="COMET Logo" 
            className="w-24 h-24 object-contain"
          />
        </div>
      </div>

      {/* Nombre de la app */}
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold text-white">
          COMET
        </h1>
        <p className="text-blue-100 text-sm mt-2">
          Sistema de Gestión Municipal
        </p>
      </div>

      {/* Loading bar - empieza descargada y se llena cuando el cometa llega */}
      <div className="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-6">
        <div className="h-full bg-white animate-loading-bar-fill"></div>
      </div>

      {/* Logo de la municipalidad - aparece cuando el cometa se posiciona */}
      <div className="absolute bottom-32 animate-muni-logo-appear">
        <img 
          src="/municipality-logo.svg" 
          alt="Municipalidad Logo" 
          className="w-20 h-20 opacity-90"
        />
      </div>
    </div>
  );
}