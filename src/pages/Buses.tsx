import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bus, MapPin, Navigation, Send, Play, Square } from 'lucide-react';
import { api } from '../lib/api';
import HotspotsMap from '../components/HotspotsMap';
import { useAuth } from '../context/AuthContext';

type ActiveBus = { _id: string; driverId: string; busNumber?: string; busId?: string; routeStart?: string; routeEnd?: string; fee?: number; status: string; lat?: number; lng?: number };

export default function Buses() {
  const { user } = useAuth();
  const [active, setActive] = useState<ActiveBus[]>([]);
  const [centerId, setCenterId] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [myApp, setMyApp] = useState<any | null>(null);
  const [form, setForm] = useState({ busNumber: '', busId: '', routeStart: '', routeEnd: '', fee: '', driverLicense: '' });
  const pollRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const locationWatchRef = useRef<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const cedulaRef = useRef<string | null>(null);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  const googleKey = import.meta.env.VITE_GOOGLE_MAPS_KEY as string;

  const fetchActive = useCallback(async () => {
    try {
      const res = await api('/buses/active');
      if (res.ok) {
        const rows = await res.json();
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
    // Poll every 5 seconds to check if application status changed
    const myAppPoll = window.setInterval(fetchMyApp, 5000) as unknown as number;
    return () => { window.clearInterval(myAppPoll); };
  }, [fetchMyApp]);

  const points = useMemo(() => active.map((b, i) => ({ id: b._id || String(i), title: b.busNumber ? `Bus ${b.busNumber}` : 'Bus', lat: b.lat, lng: b.lng })), [active]);

  // Map now listens to selected prop; no need to force remount

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
        setApplyOpen(false);
        setForm({ busNumber: '', busId: '', routeStart: '', routeEnd: '', fee: '', driverLicense: '' });
        fetchMyApp(); // Refresh application status
        alert('Solicitud enviada. Recibirás un aviso cuando sea aprobada.');
      } else {
        const error = await res.json().catch(() => ({ message: 'No se pudo enviar la solicitud.' }));
        alert(error.message || 'No se pudo enviar la solicitud.');
      }
    } catch {
      alert('Error al enviar la solicitud.');
    }
  };

  const selected = useMemo(() => {
    const f = active.find(b => b._id === centerId);
    const hasLat = typeof f?.lat === 'number';
    const hasLng = typeof f?.lng === 'number';
    return hasLat && hasLng ? { lat: f!.lat as number, lng: f!.lng as number } : undefined;
  }, [centerId, active]);
  const selectedId = useMemo(() => centerId ?? undefined, [centerId]);

  // Driver helpers
  const getPositionOnce = () => new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalización no disponible'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });

  const resolveCedula = useCallback(() => {
    if (cedulaRef.current) {
      console.log('[Buses] Using cached cedula:', cedulaRef.current);
      return cedulaRef.current;
    }

    const stored = localStorage.getItem('cedula');
    console.log('[Buses] cedula in localStorage:', stored);
    if (stored) {
      cedulaRef.current = stored;
      return stored;
    }

    if (user?.cedula) {
      console.log('[Buses] cedula from context user:', user.cedula);
      cedulaRef.current = user.cedula;
      localStorage.setItem('cedula', user.cedula);
      return user.cedula;
    }

    try {
      const authUser = localStorage.getItem('authUser');
      console.log('[Buses] authUser blob:', authUser);
      if (authUser) {
        const parsed = JSON.parse(authUser);
        if (parsed?.cedula) {
          cedulaRef.current = parsed.cedula;
          localStorage.setItem('cedula', parsed.cedula);
          return parsed.cedula;
        }
      }
    } catch (e) {
      console.error('[Buses] Error parsing authUser:', e);
    }

    console.warn('[Buses] Cedula could not be resolved');
    return null;
  }, [user?.cedula]);

  const sendLocation = useCallback(async (lat: number, lng: number) => {
    const cedula = resolveCedula();
    console.log('[Buses] sendLocation invoked', { cedula, lat, lng });
    if (!cedula) {
      console.error('[Buses] sendLocation aborted: missing cedula');
      return false;
    }

    const r = await api('/buses/driver/ping', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ cedula, lat, lng }) 
    });

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('[Buses] sendLocation failed:', txt);
      return false;
    }

    console.log('[Buses] sendLocation succeeded');
    return true;
  }, [resolveCedula]);

  const startDriverService = useCallback(async () => {
    try {
      console.log('[Buses] startDriverService invoked');
      const cedula = resolveCedula();
      if (!cedula) throw new Error('No se pudo identificar al conductor');
      const pos = await getPositionOnce();
      console.log('[Buses] startDriverService position:', pos.coords.latitude, pos.coords.longitude);
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
      console.error('Start error:', msg);
      alert(msg);
    }
  }, [sendLocation]);

  const stopDriverService = useCallback(async () => {
    try {
      console.log('[Buses] stopDriverService invoked');
      const cedula = resolveCedula();
      if (!cedula) {
        console.error('[Buses] stopDriverService aborted: missing cedula');
        throw new Error('No se pudo identificar al conductor');
      }
      // Call the stop service endpoint
      const r = await api('/buses/driver/stop', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula })
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        console.error('[Buses] stopDriverService failed:', txt);
      }
    } catch (e) {
      console.error('Error stopping service:', e);
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
            <button onClick={fetchActive} className="px-3 py-2 rounded bg-white/20 text-white text-sm">Actualizar</button>
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
          <HotspotsMap apiKey={googleKey} points={points} selected={selected} selectedId={selectedId} height={360} showAutocomplete={false} />
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
                  <div className="p-2 bg-blue-50 rounded-lg"><Bus className="h-5 w-5 text-blue-600"/></div>
                  <div>
                    <div className="font-semibold text-gray-900">{b.routeStart || 'Inicio'} → {b.routeEnd || 'Destino'}</div>
                    <div className="text-sm text-gray-600">Bus {b.busNumber || 's/n'} • ₡{Number(b.fee || 0).toLocaleString('es-CR')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Unirse como conductor</h3>
              <button onClick={() => setApplyOpen(false)} className="text-gray-500">✕</button>
            </div>
            <form onSubmit={handleApply} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Número de bus</label>
                <input value={form.busNumber} onChange={e=>setForm(f=>({ ...f, busNumber: e.target.value }))} className="w-full border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Placa</label>
                <input value={form.busId} onChange={e=>setForm(f=>({ ...f, busId: e.target.value }))} className="w-full border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Inicio de ruta</label>
                <input value={form.routeStart} onChange={e=>setForm(f=>({ ...f, routeStart: e.target.value }))} className="w-full border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Final de ruta</label>
                <input value={form.routeEnd} onChange={e=>setForm(f=>({ ...f, routeEnd: e.target.value }))} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tarifa (₡)</label>
                <input type="number" min={0} value={form.fee} onChange={e=>setForm(f=>({ ...f, fee: e.target.value }))} className="w-full border rounded-lg p-2" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Licencia de conducir</label>
                <input value={form.driverLicense} onChange={e=>setForm(f=>({ ...f, driverLicense: e.target.value }))} className="w-full border rounded-lg p-2" required />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={()=>setApplyOpen(false)} className="px-3 py-2 rounded border">Cancelar</button>
                <button type="submit" className="px-3 py-2 rounded bg-blue-600 text-white">Enviar solicitud</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
