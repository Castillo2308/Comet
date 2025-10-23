import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
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
      console.log('[DriverServiceContext] Checking service status for cedula:', cedula);
      const r = await api('/buses/driver/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula })
      });
      if (r.ok) {
        const data = await r.json();
        console.log('[DriverServiceContext] Service status response:', data);
        if (data.isRunning) {
          console.log('[DriverServiceContext] Service is running, setting isRunning=true');
          setIsRunning(true);
          cedulaRef.current = cedula;
          saveState({ isRunning: true, cedula });
          // Restart location tracking if needed
          startLocationTracking();
        } else {
          console.log('[DriverServiceContext] Service is not running, cleaning up');
          // Service was stopped on backend, clean up
          cleanup();
        }
      } else {
        console.log('[DriverServiceContext] Error response:', r.status);
      }
    } catch (error) {
      console.error('[DriverServiceContext] Error checking service status:', error);
    }
  };

  // Load state from localStorage and check database on mount or when user changes
  useEffect(() => {
    const initializeServiceState = async () => {
      if (!user?.cedula) return; // Wait for user to be available

      // Always check database status for authenticated users
      await checkServiceStatus(user.cedula);
    };

    initializeServiceState();
  }, [user?.cedula]); // Depend on user.cedula to re-run when user is available

  const resolveCedula = () => {
    if (cedulaRef.current) return cedulaRef.current;

    // Use user from context if available
    if (user?.cedula) {
      cedulaRef.current = user.cedula;
      localStorage.setItem('cedula', user.cedula);
      return user.cedula;
    }

    // Fallback to localStorage
    const stored = localStorage.getItem('cedula');
    if (stored) {
      cedulaRef.current = stored;
      return stored;
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

      console.log('[DriverServiceContext.startService] Starting service for cedula:', cedula);
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

      const response = await r.json();
      console.log('[DriverServiceContext.startService] Backend response:', response);

      setIsRunning(true);
      cedulaRef.current = cedula;
      lastSentRef.current = Date.now();

      const stateData = {
        isRunning: true,
        cedula,
        startTime: Date.now(),
        lastLocation: { lat: pos.coords.latitude, lng: pos.coords.longitude }
      };
      console.log('[DriverServiceContext.startService] Saving state:', stateData);
      saveState(stateData);

      // Start location tracking
      startLocationTracking();

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'No se pudo iniciar el servicio';
      console.error('[DriverServiceContext.startService] Error:', msg);
      throw new Error(msg);
    }
  };

  const stopService = async (): Promise<void> => {
    try {
      const cedula = resolveCedula();
      console.log('[DriverServiceContext.stopService] Stopping service for cedula:', cedula);
      if (cedula) {
        // Call the stop service endpoint
        const r = await api('/buses/driver/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cedula })
        });
        console.log('[DriverServiceContext.stopService] Backend response status:', r.status);
      }
    } catch (error) {
      console.error('[DriverServiceContext.stopService] Error:', error);
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