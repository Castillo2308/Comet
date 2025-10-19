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

// Simple IndexedDB helpers for SW-side persistence
function idbOpen(dbName: string, storeName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(dbName: string, storeName: string, key: IDBValidKey, value: any) {
  const db = await idbOpen(dbName, storeName);
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

async function idbGet<T = any>(dbName: string, storeName: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await idbOpen(dbName, storeName);
  return new Promise<T | undefined>((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => { db.close(); resolve(req.result as T | undefined); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function getClient(): Promise<WindowClient | Client | null> {
  const all = await swSelf.clients.matchAll({ type: 'window', includeUncontrolled: true });
  return all.length ? all[0] : null;
}

async function sendPing() {
  try {
    const client = await getClient();
    let loc: { lat: number; lng: number; cedula?: string; token?: string } | null = null;
    if (client) {
      // Ask page for latest location
      try {
        const mc = new MessageChannel();
        loc = await new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('location timeout')), 3000);
          mc.port1.onmessage = (event) => {
            clearTimeout(timer);
            resolve(event.data);
          };
          client.postMessage({ type: 'REQUEST_LOCATION' }, [mc.port2]);
        });
      } catch {}
    }

    if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') {
      // Fallback to last known location from IndexedDB
      loc = await idbGet('comet-driver', 'kv', 'lastLocation') as any;
    }

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
  } else if (data.type === 'UPDATE_LAST_LOCATION') {
    const loc = data.payload;
    event.waitUntil(idbSet('comet-driver', 'kv', 'lastLocation', loc).catch(()=>{}));
  }
});

// Fallback: ensure pings stop when SW is terminated naturally
swSelf.addEventListener('activate', () => {
  // no-op beyond clientsClaim/skipWaiting
});

// One-off Background Sync
swSelf.addEventListener('sync', (event: any) => {
  if (event?.tag && event.tag.startsWith('bus-ping')) {
    event.waitUntil(sendPing());
  }
});

// Periodic Background Sync (Chrome/Android installed PWA)
// Note: Requires user permission and browser support; min intervals are browser-defined.
// This will send the last known location if the page can't respond.
// @ts-ignore - periodicsync is not in all TS lib dom definitions
swSelf.addEventListener('periodicsync', (event: any) => {
  if (event?.tag === 'bus-ping') {
    event.waitUntil(sendPing());
  }
});
