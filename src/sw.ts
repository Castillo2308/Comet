/*
  Custom Service Worker for periodic pinging.
  Uses setInterval while the SW is active. In production, consider Background Sync or Periodic Background Sync (where available).
*/

/// <reference lib="WebWorker" />
// eslint-disable-next-line @typescript-eslint/triple-slash-reference

import { clientsClaim } from 'workbox-core';
const swSelf = self as unknown as ServiceWorkerGlobalScope;

clientsClaim();
swSelf.skipWaiting();

let pingTimer: number | undefined;
let pingIntervalMs = 20_000;

async function getClient(): Promise<WindowClient | Client | null> {
  const all = await swSelf.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return all.length ? all[0] : null;
}

async function sendPing() {
  try {
    const client = await getClient();
    if (!client) return;

    // Ask page for latest location
    const mc = new MessageChannel();
    const loc: { lat: number; lng: number; cedula?: string; token?: string } = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('location timeout')), 4000);
      mc.port1.onmessage = (event) => {
        clearTimeout(timer);
        resolve(event.data);
      };
      client.postMessage({ type: 'REQUEST_LOCATION' }, [mc.port2]);
    });

    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;

    await fetch('/api/buses/driver/ping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(loc.token ? { Authorization: `Bearer ${loc.token}` } : {})
      },
      body: JSON.stringify({ cedula: loc.cedula, lat: loc.lat, lng: loc.lng })
    });
  } catch (e) {
    // swallow errors to keep timer alive
    console.error('[SW] ping error', e);
  }
}

function startPings() {
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = setInterval(sendPing, pingIntervalMs) as unknown as number;
  // fire one immediately to prime
  sendPing();
}

function stopPings() {
  if (pingTimer) clearInterval(pingTimer);
  pingTimer = undefined;
}

swSelf.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = (event as any).data;
  if (!data) return;
  if (data.type === 'START_PINGS') {
    pingIntervalMs = typeof data.interval === 'number' ? data.interval : 20_000;
    startPings();
  } else if (data.type === 'STOP_PINGS') {
    stopPings();
  }
});

// Fallback: ensure pings stop when SW is terminated naturally
swSelf.addEventListener('activate', () => {
  // no-op beyond clientsClaim/skipWaiting
});
