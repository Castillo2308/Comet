import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bus, MapPin, Navigation, Send, Play, Square } from 'lucide-react';
import { api } from '../lib/api';
import RoutePreviewMap from '../components/RoutePreviewMap';
import BusesMap from '../components/BusesMap';
import { GoogleMapsProvider } from '../components/GoogleMapsProvider';
import { useAuth } from '../context/AuthContext';

type ActiveBus = { _id: string; driverId: string; busNumber?: string; busId?: string; routeStart?: string; routeEnd?: string; routeWaypoints?: Array<{lat: number; lng: number}>; displayRoute?: Array<{lat: number; lng: number}>; pickupRoute?: Array<{lat: number; lng: number}>; stage?: 'pickup' | 'route'; arrivedAtStart?: boolean; fee?: number; status: string; lat?: number; lng?: number; routeColor?: string; duration?: string };

// Get Google Maps API key from environment, with fallback
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || 'AIzaSyDluFc7caulw2jHJKsPM_mGnLa8oLuFgio';

export default function Buses() {
  const { user } = useAuth();
  const [active, setActive] = useState<ActiveBus[]>([]);
  const [busDurations, setBusDurations] = useState<Map<string, string>>(new Map());
  const [centerId, setCenterId] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [myApp, setMyApp] = useState<any | null>(null);
  const [form, setForm] = useState({ busNumber: '', busId: '', routeStart: '', routeEnd: '', fee: '', driverLicense: '', routeColor: '#3B82F6' });
  const [busColorForForm] = useState('#3B82F6'); // Color para el mapa del formulario
  const pollRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const locationWatchRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const cedulaRef = useRef<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const fetchActive = useCallback(async () => {
    try {
      const res = await api('/buses/active');
      if (res.ok) {
        const rows = await res.json();
        console.log('[fetchActive] Buses received:', rows.map((b: any) => ({ busId: b.busId, routeColor: b.routeColor, stage: b.stage })));
        setActive(rows || []);
      }
    } catch {}
  }, []);

  const fetchMyApp = useCallback(async () => {
    try {
      const cedula = localStorage.getItem('cedula');
      if (!cedula) return;
      const r = await api('/buses/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula }),
      });
      if (r.ok) setMyApp(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchActive();
    // Refresh active buses roughly every 20 seconds
    pollRef.current = window.setInterval(fetchActive, 20000) as unknown as number;
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [fetchActive]);

  useEffect(() => {
    fetchMyApp();
    // Poll more frequently when driver is running (2 seconds), otherwise every 5 seconds
    const interval = running ? 2000 : 5000;
    const myAppPoll = window.setInterval(fetchMyApp, interval) as unknown as number;
    return () => { window.clearInterval(myAppPoll); };
  }, [fetchMyApp, running]);

  // Handle duration updates from map
  const handleDurationUpdate = useCallback((busId: string, duration: string) => {
    setBusDurations(prev => new Map(prev.set(busId, duration)));
  }, []);

  // Debug: Log active buses data
  useEffect(() => {
    if (active.length > 0) {
      console.log('[Buses.tsx] Active buses list:', active.map(b => ({ busId: b.busId, routeColor: b.routeColor, stage: b.stage })));
    }
  }, [active]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cedula = localStorage.getItem('cedula');
      if (!cedula) {
        alert('No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.');
        return;
      }
      const payload = { ...form, fee: Number(form.fee), cedula };
      const res = await api('/buses/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        setForm({ busNumber: '', busId: '', routeStart: '', routeEnd: '', fee: '', driverLicense: '', routeColor: '#3B82F6' });
        fetchMyApp(); // Refresh application status
        setApplyOpen(false); // Close modal on success
      } else {
        const error = await res.json().catch(() => ({ message: 'No se pudo enviar la solicitud.' }));
        alert(error.message || 'No se pudo enviar la solicitud.');
      }
    } catch {
      alert('Error al enviar la solicitud.');
    }
  };

  // Driver helpers
  const getPositionOnce = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });

  const resolveCedula = useCallback(() => {
    if (cedulaRef.current) {
      
      return cedulaRef.current;
    }

    const stored = localStorage.getItem('cedula');
    
    if (stored) {
      cedulaRef.current = stored;
      return stored;
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

  const sendLocation = useCallback(async (lat: number, lng: number) => {
    const cedula = resolveCedula();
    
    if (!cedula) {
      
      return false;
    }

    const r = await api('/buses/driver/ping', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ cedula, lat, lng }) 
    });

    if (!r.ok) {
      return false;
    }

    
    return true;
  }, [resolveCedula]);

  const startDriverService = useCallback(async () => {
    try {
      
      const cedula = resolveCedula();
      if (!cedula) throw new Error('No se pudo identificar al conductor');
      const pos = await getPositionOnce();
      
      // Call the new start service endpoint with initial location
      const r = await api('/buses/driver/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, lat: pos.coords.latitude, lng: pos.coords.longitude })
      });
      if (!r.ok) {
        const error = await r.json().catch(() => ({ message: 'No se pudo iniciar el servicio' }));
        throw new Error(error.message || 'No se pudo iniciar el servicio');
      }
      runningRef.current = true;
      setRunning(true);
      lastSentRef.current = Date.now();
      if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = navigator.geolocation.watchPosition(async (p) => {
        const now = Date.now();
        if (now - lastSentRef.current < 10_000) return;
        const sent = await sendLocation(p.coords.latitude, p.coords.longitude);
        if (sent) lastSentRef.current = now;
      }, () => {}, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo iniciar el servicio';
      
      alert(msg);
    }
  }, [sendLocation]);

  const stopDriverService = useCallback(async () => {
    try {
      
      const cedula = resolveCedula();
      if (!cedula) {
        
        throw new Error('No se pudo identificar al conductor');
      }
      // Call the stop service endpoint
      const r = await api('/buses/driver/stop', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula })
      });
      if (!r.ok) {
        // No alert; silently ignore stop error to avoid noisy UX
      }
    } catch (e) {
      
    } finally {
      runningRef.current = false;
      setRunning(false);
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
        locationWatchRef.current = null;
      }
    }
  }, []);

  useEffect(() => () => {
    if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
  }, []);

  return (
    <GoogleMapsProvider apiKey={GOOGLE_MAPS_KEY}>
      <div className="flex-1 overflow-y-auto pb-20 min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 px-4 py-5 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Bus className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Buses</h1>
              <p className="text-blue-100 text-sm">Ubicaciones en tiempo real</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            
            {!myApp && (
              <button onClick={() => setApplyOpen(true)} className="px-3 py-2 rounded bg-white text-blue-700 text-sm font-medium flex items-center gap-1">
                <Send className="h-4 w-4" /> Unirse como conductor
              </button>
            )}
            {(myApp?.status === 'approved' || user?.role === 'driver') && (
              !running ? (
                <button onClick={startDriverService} className="px-3 py-2 rounded bg-green-600 text-white text-sm font-medium flex items-center gap-1">
                  <Play className="h-4 w-4" /> Iniciar servicio
                </button>
              ) : (
                <button onClick={stopDriverService} className="px-3 py-2 rounded bg-red-600 text-white text-sm font-medium flex items-center gap-1">
                  <Square className="h-4 w-4" /> Detener
                </button>
              )
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {myApp && (
          <div className="p-4 bg-white rounded-xl border">
            <div className="text-sm text-gray-700">
              <strong>Tu solicitud:</strong> {myApp.routeStart || 'Inicio'} → {myApp.routeEnd || 'Destino'} • Bus {myApp.busNumber || 's/n'}
            </div>
            <div className="mt-2 text-sm">
              <strong>Estado: </strong>
              {myApp.status === 'pending' && <span className="text-yellow-600">⏳ Pendiente de aprobación</span>}
              {myApp.status === 'approved' && <span className="text-green-600">✓ Aprobado - Ya puedes iniciar servicio</span>}
              {myApp.status === 'rejected' && <span className="text-red-600">✗ Rechazado</span>}
            </div>
          </div>
        )}

  <section ref={mapSectionRef}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center"><MapPin className="h-5 w-5 mr-2 text-blue-600"/>Mapa</h2>
            <div className="flex items-center gap-2 text-sm text-green-700"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> En vivo</div>
          </div>
          <BusesMap
            buses={active}
            selectedBusId={centerId}
            onSelectBus={(busId) => setCenterId(busId as string)}
            height={360}
            onDurationUpdate={handleDurationUpdate}
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Buses en servicio</h2>
          <div className="space-y-3">
            {active.length === 0 && (
              <div className="p-4 bg-white rounded-xl border text-gray-600">No hay buses en servicio en este momento.</div>
            )}
            {active.map((b) => (
              <div key={b._id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: b.routeColor ? `${b.routeColor}20` : '#EBF5FF' }}>
                    <Bus className="h-5 w-5" style={{ color: b.routeColor || '#3B82F6' }}/>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{b.routeStart || 'Inicio'} → {b.routeEnd || 'Destino'}</div>
                    <div className="text-sm text-gray-600">
                      Bus {b.busNumber || 's/n'} • ₡{Number(b.fee || 0).toLocaleString('es-CR')}
                      {busDurations.get(b._id) && (
                        <span className="ml-2 text-blue-600 font-medium">• ⏱️ {busDurations.get(b._id)} al destino</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full border-2" style={{ backgroundColor: b.routeColor || '#3B82F6', borderColor: b.routeColor || '#3B82F6' }} title={`Color: ${b.routeColor || '#3B82F6'}`} />
                  {(typeof b.lat === 'number' && typeof b.lng === 'number') ? (
                    <button onClick={() => { setCenterId(b._id); mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="px-3 py-2 rounded bg-blue-500 text-white text-sm flex items-center gap-1"><Navigation className="h-4 w-4"/>Ubicar en el mapa</button>
                  ) : (
                    <span className="text-xs text-gray-500">Sin ubicación</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {applyOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 my-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Unirse como conductor</h3>
              <button onClick={() => setApplyOpen(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleApply} className="space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Número de bus</label>
                  <input value={form.busNumber} onChange={e=>setForm(f=>({ ...f, busNumber: e.target.value }))} className="w-full border rounded-lg p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Placa</label>
                  <input value={form.busId} onChange={e=>setForm(f=>({ ...f, busId: e.target.value }))} className="w-full border rounded-lg p-2" required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Inicio de ruta</label>
                  <input value={form.routeStart} onChange={e=>setForm(f=>({ ...f, routeStart: e.target.value }))} className="w-full border rounded-lg p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Final de ruta</label>
                  <input value={form.routeEnd} onChange={e=>setForm(f=>({ ...f, routeEnd: e.target.value }))} className="w-full border rounded-lg p-2" />
                </div>
              </div>

              {/* Color Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">🎨 Color de ruta</label>
                <div className="flex gap-2 flex-wrap">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, routeColor: color }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.routeColor === color ? 'border-gray-800 scale-110' : 'border-gray-300'}`}
                      style={{ backgroundColor: color }}
                      title={`Seleccionar color`}
                    />
                  ))}
                </div>
              </div>

              {/* Route Preview Map - Always show */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">📍 Vista previa de ruta</label>
                <RoutePreviewMap
                  routeStart={form.routeStart}
                  routeEnd={form.routeEnd}
                  height={300}
                  busColor={busColorForForm}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tarifa (₡)</label>
                  <input type="number" min={0} value={form.fee} onChange={e=>setForm(f=>({ ...f, fee: e.target.value }))} className="w-full border rounded-lg p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Licencia de conducir</label>
                  <input value={form.driverLicense} onChange={e=>setForm(f=>({ ...f, driverLicense: e.target.value }))} className="w-full border rounded-lg p-2" required />
                </div>
              </div>

              {/* Route capture section REMOVED - Backend will calculate route automatically */}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button type="button" onClick={()=>setApplyOpen(false)} className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Enviar solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </GoogleMapsProvider>
  );
}
