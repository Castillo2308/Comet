// Client helper to communicate with the service worker for background pings

export async function startServiceWorkerPings(intervalMs = 20_000) {
  const reg = await navigator.serviceWorker.ready.catch(() => undefined);
  const sw = reg?.active;
  if (sw) {
    sw.postMessage({ type: 'START_PINGS', interval: intervalMs });
    // Try to register background sync to increase reliability
    try {
      // One-off sync
      // @ts-ignore
      if ('sync' in reg) await reg.sync.register('bus-ping-oneshot');
    } catch {}
    try {
      // Periodic background sync
      // @ts-ignore
      const ps = await (reg as any).periodicSync?.getTags?.();
      // @ts-ignore
      if ((reg as any).periodicSync && (!ps || !ps.includes('bus-ping'))) {
        // @ts-ignore
        await (reg as any).periodicSync.register('bus-ping', { minInterval: intervalMs });
      }
    } catch {}
  }
}

export async function stopServiceWorkerPings() {
  const reg = await navigator.serviceWorker.ready.catch(() => undefined);
  const sw = reg?.active;
  if (sw) {
    sw.postMessage({ type: 'STOP_PINGS' });
  }
}

export function setupLocationResponder(getLocation: () => { lat: number; lng: number; cedula?: string; token?: string } | null) {
  // Respond to SW requests for latest location
  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    const data = (event as any).data;
    if (!data || data.type !== 'REQUEST_LOCATION') return;
    const source = (event as any).source as ServiceWorker | MessagePort | WindowProxy | null;

    // If the SW asked through a MessagePort, respond via that
    const port = (event as any).ports && (event as any).ports[0];
    const loc = getLocation();
    if (port) {
      port.postMessage(loc ?? {});
    } else if (source && 'postMessage' in source) {
      (source as any).postMessage(loc ?? {});
    }
  });

  // Also push last location to SW for fallback storage whenever it changes
  let lastSent = 0;
  const pushLoc = () => {
    const now = Date.now();
    if (now - lastSent < 5000) return; // throttle
    lastSent = now;
    try {
      const regPromise = navigator.serviceWorker.ready;
      regPromise.then(reg => {
        const sw = reg?.active;
        if (!sw) return;
        const loc = getLocation();
        if (loc && typeof loc.lat === 'number' && typeof loc.lng === 'number') {
          sw.postMessage({ type: 'UPDATE_LAST_LOCATION', payload: loc });
        }
      }).catch(()=>{});
    } catch {}
  };

  // Expose a global hook to push updates when app state changes
  (window as any).__pushSWLocationUpdate = pushLoc;
}
