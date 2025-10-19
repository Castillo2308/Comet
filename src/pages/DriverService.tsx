import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Square, MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { setupLocationResponder, startServiceWorkerPings, stopServiceWorkerPings } from '../lib/swClient';
import { useAuth } from '../context/AuthContext';

export default function DriverService() {
  const { user } = useAuth();
  const [running, setRunning] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const cedulaRef = useRef<string | null>(null);
  const pingIntervalRef = useRef<number | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  // Helper function to resolve and memoize the driver's cedula just like startService expects.
  const getCedula = useCallback(() => {
    if (cedulaRef.current) {
      
      return cedulaRef.current;
    }

    const storedCedula = localStorage.getItem('cedula');
    
    if (storedCedula) {
      cedulaRef.current = storedCedula;
      return storedCedula;
    }

    if (user?.cedula) {
      
      cedulaRef.current = user.cedula;
      localStorage.setItem('cedula', user.cedula);
      return user.cedula;
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
      
    }

    
    return null;
  }, [user?.cedula]);

  const getPositionOnce = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });

  const sendPing = useCallback(async (lat: number, lng: number) => {
    try {
      const cedula = getCedula();
      if (!cedula) throw new Error('No se pudo identificar al conductor');

      const r = await api('/buses/driver/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, lat, lng })
      });

      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        setError(txt || 'Fallo al enviar ubicación');
        return false;
      }

      setLastPing(new Date());
      lastSentRef.current = Date.now();
      return true;
    } catch (e: any) {
      setError(e?.message || 'Fallo al enviar ubicación');
      return false;
    }
  }, [getCedula]);

  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setError('Geolocalización no disponible'); return; }
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = navigator.geolocation.watchPosition((p) => {
      
      // Just update the position reference - the interval loop will handle sending pings
      lastPositionRef.current = { lat: p.coords.latitude, lng: p.coords.longitude };
      try { (window as any).__pushSWLocationUpdate?.(); } catch {}
    }, (err) => {
      
      setError(err?.message || 'No se pudo obtener ubicación');
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  }, []);

  const stopWatch = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const startPingLoop = useCallback(() => {
    // Prefer SW-driven pings to avoid throttling; keep local timer disabled by default
    if (pingIntervalRef.current !== null) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    startServiceWorkerPings(20_000);
  }, [sendPing]);

  const stopPingLoop = useCallback(() => {
    // Stop SW-driven pings
    stopServiceWorkerPings();
    if (pingIntervalRef.current !== null) {
      window.clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
  }, []);

  const startService = useCallback(async () => {
    try {
      
      const cedula = getCedula();
      if (!cedula) throw new Error('No se pudo identificar al conductor');

      const pos = await getPositionOnce();
      
      lastPositionRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      const r = await api('/buses/driver/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, lat: pos.coords.latitude, lng: pos.coords.longitude })
      });

      
      if (!r.ok) {
        const txt = await r.text().catch(()=> '');
        setError(txt || 'No se pudo iniciar el servicio');
        
        return;
      }

      cedulaRef.current = cedula; // Cache cedula once we know start succeeded
      setRunning(true);
      lastSentRef.current = Date.now();
      startWatch(); // Start watching position (only updates lastPositionRef)
      startPingLoop(); // Delegate to SW pings

      // Try to keep CPU/GPS alive with Wake Lock where supported
      try {
        // @ts-ignore
        if ('wakeLock' in navigator) {
          // @ts-ignore
          const lock = await (navigator as any).wakeLock.request('screen');
          (window as any).__driverWakeLock = lock;
          document.addEventListener('visibilitychange', async () => {
            // Re-acquire wake lock when tab becomes visible again
            // @ts-ignore
            if (document.visibilityState === 'visible' && 'wakeLock' in navigator && running) {
              try { (window as any).__driverWakeLock = await (navigator as any).wakeLock.request('screen'); } catch {}
            }
          });
        }
      } catch {}
    } catch (e: any) {
      
      setError(e?.message || 'Se requiere tu ubicación para iniciar');
    }
  }, [getCedula, startPingLoop, startWatch]);

  const stopService = useCallback(async () => {
    try {
      
      const cedula = getCedula();
      if (!cedula) throw new Error('No se pudo identificar al conductor');

      const r = await api('/buses/driver/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula })
      });

      
      if (!r.ok) {
        const txt = await r.text().catch(()=> '');
        setError(txt || 'No se pudo detener el servicio');
        console.error('[DriverService] stopService failed:', txt);
        return;
      }

      setRunning(false);
      stopPingLoop();
      stopWatch();
      try { (window as any).__driverWakeLock?.release?.(); } catch {}
      (window as any).__driverWakeLock = undefined;
      console.log('[DriverService] stopService succeeded');
      setError(null);
    } catch (e: any) {
      console.error('[DriverService] stopService exception:', e);
      setError(e?.message || 'No se pudo detener el servicio');
    }
  }, [getCedula, stopPingLoop, stopWatch]);

  // Cleanup on unmount
  useEffect(() => () => {
    stopPingLoop();
    stopWatch();
  }, [stopPingLoop, stopWatch]);

  // Handle visibility changes: keep both GPS watch and ping loop always running when service is active
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        console.log('👁️ [TAB HIDDEN] Service continues running in background');
        // Keep both GPS watch and ping loop running for continuous updates
      } else if (document.visibilityState === 'visible' && running) {
        console.log('👁️ [TAB VISIBLE] Service running');
        // Ensure everything is still running (should never need to restart)
        if (pingIntervalRef.current === null) {
          console.warn('⚠️ Ping loop was stopped unexpectedly, restarting...');
          startPingLoop();
        }
        if (watchIdRef.current === null) {
          console.warn('⚠️ GPS watch was stopped unexpectedly, restarting...');
          startWatch();
        }
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [running, startPingLoop, startWatch]);

  // Respond to SW with latest location and credentials (cedula + token)
  useEffect(() => {
    const getLatest = () => {
      const cedula = cedulaRef.current || getCedula() || undefined;
      const token = localStorage.getItem('authToken') || undefined;
      if (lastPositionRef.current) {
        return { lat: lastPositionRef.current.lat, lng: lastPositionRef.current.lng, cedula, token };
      }
      return null;
    };
    setupLocationResponder(getLatest);
  }, [getCedula]);

  const lastPingText = useMemo(() => lastPing ? `${Math.round((Date.now() - lastPing.getTime())/1000)}s` : '—', [lastPing]);

  return (
    <div className="p-4 space-y-5">
      <div className="bg-white rounded-2xl p-5 border shadow-sm">
        <h1 className="text-xl font-semibold mb-2">Servicio de Conductor</h1>
        <p className="text-sm text-gray-600">Comparte tu ubicación cada 20 segundos mientras estás en servicio.</p>
  <p className="text-xs text-gray-500 mt-2">Conductor: {getCedula() || 'No identificado'}</p>
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      </div>

      <div className="bg-white rounded-2xl p-6 border shadow-sm flex flex-col items-center justify-center text-center">
        <div className="mb-4">
          <div className="text-gray-800 font-semibold text-lg">{running ? 'En Servicio' : 'Detenido'}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1"><MapPin className="h-4 w-4"/>Último ping: {lastPingText}</div>
        </div>

        {!running ? (
          <button
            onClick={startService}
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95"
            aria-label="Iniciar servicio"
          >
            <div className="flex flex-col items-center">
              <Play className="w-10 h-10 sm:w-12 sm:h-12 mb-2" />
              <span className="font-bold text-xl sm:text-2xl">Iniciar</span>
            </div>
          </button>
        ) : (
          <button
            onClick={stopService}
            className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-2xl flex items-center justify-center transition-transform active:scale-95"
            aria-label="Detener servicio"
          >
            <div className="flex flex-col items-center">
              <Square className="w-10 h-10 sm:w-12 sm:h-12 mb-2" />
              <span className="font-bold text-xl sm:text-2xl">Detener</span>
            </div>
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center">
        Consejo: mantener esta pantalla abierta mejora la precisión. Próximo: habilitar Background Sync para pings en segundo plano.
      </div>
    </div>
  );
}
