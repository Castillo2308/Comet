import React, { createContext, useContext } from 'react';
import { useLoadScript } from '@react-google-maps/api';

// Static libraries array to prevent reloading
const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry" | "drawing")[] = ['places'];

interface GoogleMapsContextType {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
});

interface GoogleMapsProviderProps {
  children: React.ReactNode;
  apiKey: string;
}

export function GoogleMapsProvider({ children, apiKey }: GoogleMapsProviderProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}