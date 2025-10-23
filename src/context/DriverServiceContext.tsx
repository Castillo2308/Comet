import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

interface DriverServiceState {
  isRunning: boolean;
  lastLocation: { lat: number; lng: number } | null;
  startTime: number | null;
  cedula: string | null;
}

interface DriverServiceContextType {
  isRunning: boolean;
  startService: () => Promise<void>;
  stopService: () => Promise<void>;
  sendLocation: (lat: number, lng: number) => Promise<boolean>;
}

const DriverServiceContext = createContext<DriverServiceContextType | undefined>(undefined);

const STORAGE_KEY = 'driverServiceState';

export function DriverServiceProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false);
  const locationWatchRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const cedulaRef = useRef<string | null>(null);

  const saveState = (state: Partial<DriverServiceState>) => {
    const currentState = localStorage.getItem(STORAGE_KEY);
    const parsedState = currentState ? JSON.parse(currentState) : {};
    const newState = { ...parsedState, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  };

  const checkServiceStatus = async (cedula: string) => {
    try {
      const r = await api('/buses/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula })
      });
      if (r.ok) {
        const data = await r.json();
        if (data.isRunning) {
          setIsRunning(true);
          cedulaRef.current = cedula;
          saveState({ isRunning: true, cedula });
          // Restart location tracking if needed
          startLocationTracking();
        } else {
          // Service was stopped on backend, clean up
          cleanup();
        }
      }
    } catch (error) {
      console.error('Error checking service status:', error);
    }
  };

  // Load state from localStorage and check database on mount
  useEffect(() => {
    const initializeServiceState = async () => {
      // First try to get cedula from various sources
      const cedula = resolveCedula();
      if (cedula) {
        // Always check database status for authenticated users
        await checkServiceStatus(cedula);
      }
    };

    initializeServiceState();
  }, []);

  const resolveCedula = () => {
    if (cedulaRef.current) return cedulaRef.current;

    const stored = localStorage.getItem('cedula');
    if (stored) {
      cedulaRef.current = stored;
      return stored;
    }

    try {
      const authUser = localStorage.getItem('authUser');
      if (authUser) {
        const parsed = JSON.parse(authUser);
        if (parsed?.cedula) {
          cedulaRef.current = parsed.cedula;
          localStorage.setItem('cedula', parsed.cedula);
          return parsed.cedula;
        }
      }
    } catch (e) {
      console.error('Error resolving cedula:', e);
    }

    return null;
  };

  const getPositionOnce = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible'));

    // Request permission explicitly
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          reject(new Error('Permiso de geolocalización denegado. Por favor, habilita la geolocalización en tu navegador.'));
          return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      }).catch(() => {
        // Fallback if permissions API is not available
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
    } else {
      // Fallback for browsers without permissions API
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000
      });
    }
  });

  const sendLocation = async (lat: number, lng: number): Promise<boolean> => {
    const cedula = resolveCedula();
    if (!cedula) return false;

    try {
      const r = await api('/buses/driver/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, lat, lng })
      });

      if (r.ok) {
        saveState({ lastLocation: { lat, lng } });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error sending location:', error);
      return false;
    }
  };

  const startLocationTracking = () => {
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
    }

    locationWatchRef.current = navigator.geolocation.watchPosition(async (position) => {
      const now = Date.now();
      if (now - lastSentRef.current < 10000) return; // Send every 10 seconds

      const sent = await sendLocation(position.coords.latitude, position.coords.longitude);
      if (sent) {
        lastSentRef.current = now;
      }
    }, (error) => {
      console.error('Location tracking error:', error);
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  };

  const startService = async (): Promise<void> => {
    try {
      const cedula = resolveCedula();
      if (!cedula) throw new Error('No se pudo identificar al conductor');

      const pos = await getPositionOnce();

      // Call the start service endpoint
      const r = await api('/buses/driver/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, lat: pos.coords.latitude, lng: pos.coords.longitude })
      });

      if (!r.ok) {
        const error = await r.json().catch(() => ({ message: 'No se pudo iniciar el servicio' }));
        throw new Error(error.message || 'No se pudo iniciar el servicio');
      }

      setIsRunning(true);
      cedulaRef.current = cedula;
      lastSentRef.current = Date.now();

      saveState({
        isRunning: true,
        cedula,
        startTime: Date.now(),
        lastLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      });

      // Start location tracking
      startLocationTracking();

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo iniciar el servicio';
      throw new Error(msg);
    }
  };

  const stopService = async (): Promise<void> => {
    try {
      const cedula = resolveCedula();
      if (cedula) {
        // Call the stop service endpoint
        await api('/buses/driver/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula })
        });
      }
    } catch (error) {
      console.error('Error stopping service:', error);
    } finally {
      cleanup();
    }
  };

  const cleanup = () => {
    setIsRunning(false);
    if (locationWatchRef.current !== null) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
    cedulaRef.current = null;
    localStorage.removeItem(STORAGE_KEY);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  return (
    <DriverServiceContext.Provider value={{
      isRunning,
      startService,
      stopService,
      sendLocation
    }}>
      {children}
    </DriverServiceContext.Provider>
  );
}

export function useDriverService() {
  const context = useContext(DriverServiceContext);
  if (context === undefined) {
    throw new Error('useDriverService must be used within a DriverServiceProvider');
  }
  return context;
}