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

// Request notification permission if needed
async function ensureNotificationPermission() {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const p = await Notification.requestPermission();
    return p === 'granted';
  } catch { return false; }
}

// Start periodic news checks in SW and send the auth token to SW for authenticated fetches
export async function startServiceWorkerNewsChecks(token?: string, intervalMs = 60_000) {
  const granted = await ensureNotificationPermission();
  if (!granted) {
    // still proceed; SW showNotification will be no-op without permission
  }
  const reg = await navigator.serviceWorker.ready.catch(() => undefined);
  const sw = reg?.active;
  if (sw) {
    if (token) sw.postMessage({ type: 'UPDATE_AUTH_TOKEN', token });
    sw.postMessage({ type: 'START_NEWS_CHECK', interval: intervalMs });
    // Try background sync variants to increase reliability
    try {
      // One-off sync
      // @ts-ignore
      if ('sync' in reg) await reg.sync.register('news-check-oneshot');
    } catch {}
    try {
      // Periodic background sync
      // @ts-ignore
      const ps = await (reg as any).periodicSync?.getTags?.();
      // @ts-ignore
      if ((reg as any).periodicSync && (!ps || !ps.includes('news-check'))) {
        // @ts-ignore
        await (reg as any).periodicSync.register('news-check', { minInterval: intervalMs });
      }
    } catch {}
  }

  // As a foreground fallback, trigger checks from the page too (throttled by intervalMs)
  try {
    let lastTrigger = 0;
    const tick = () => {
      const now = Date.now();
      if (now - lastTrigger >= intervalMs) {
        lastTrigger = now;
        navigator.serviceWorker.ready.then(r => r.active?.postMessage({ type: 'TRIGGER_NEWS_CHECK' })).catch(()=>{});
      }
    };
    // fire once and then on visibility change + interval
    tick();
    const iv = window.setInterval(tick, Math.max(30_000, Math.floor(intervalMs / 2)));
    const onVis = () => { if (document.visibilityState === 'visible') tick(); };
    document.addEventListener('visibilitychange', onVis);
    // store cleanup on window for simplicity
    (window as any).__newsCheckCleanup = () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVis);
    };
  } catch {}
}

export async function stopServiceWorkerNewsChecks() {
  const reg = await navigator.serviceWorker.ready.catch(() => undefined);
  const sw = reg?.active;
  if (sw) {
    sw.postMessage({ type: 'STOP_NEWS_CHECK' });
  }
  try { (window as any).__newsCheckCleanup?.(); } catch {}
}
