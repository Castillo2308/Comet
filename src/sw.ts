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
let newsTimer: number | undefined;
let newsIntervalMs = 60_000; // default 1 minute

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

async function checkNews() {
  try {
    // get token from IDB
    const token = await idbGet<string>('comet-driver', 'kv', 'authToken');
    if (!token) return;
    const res = await fetch('/api/news', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const rows = await res.json();
    if (!Array.isArray(rows)) return;
    if (!rows.length) return;

    // Compute max id and max time across all rows
    const maxId = rows.reduce((m: number, n: any) => {
      const v = Number(n?.id) || 0; return v > m ? v : m;
    }, 0);
    const maxTime = rows.reduce((m: number, n: any) => {
      let t = 0; try { t = new Date(n?.date).getTime(); } catch { t = 0; }
      return Number.isFinite(t) && t > m ? t : m;
    }, 0);

    const lastSeenTime = (await idbGet<number>('comet-driver', 'kv', 'lastNewsTime')) || 0;
    const lastSeenId = (await idbGet<number>('comet-driver', 'kv', 'lastNewsId')) || 0;

    const hasNewByTime = Number.isFinite(maxTime) && maxTime > lastSeenTime;
    const hasNewById = Number.isFinite(maxId) && maxId > lastSeenId;

    if (hasNewByTime || hasNewById) {
      // Pick a representative new item: prefer newest by date beyond last seen; otherwise newest by id beyond last seen
      let latest: any = rows.find((n: any) => {
        try { return new Date(n.date).getTime() > lastSeenTime; } catch { return false; }
      });
      if (!latest && hasNewById) {
        latest = rows.find((n: any) => (Number(n?.id) || 0) > lastSeenId) || rows[0];
      }
      const rawTitle = (latest?.title || 'Nueva noticia').toString();
      const rawDesc = (latest?.description || '').toString();
      const words = rawDesc.trim().split(/\s+/).filter(Boolean);
      const truncated = words.slice(0, 40);
      const preview = truncated.join(' ') + (words.length > 40 ? '' : '');
      const thisId = Number(latest?.id) || maxId || 0;
      await swSelf.registration.showNotification(rawTitle, {
        body: preview || 'Revisa las últimas noticias municipales.',
        tag: thisId ? `news-${thisId}` : 'news-update'
      });
      await idbSet('comet-driver', 'kv', 'lastNewsTime', maxTime || Date.now());
      if (thisId) await idbSet('comet-driver', 'kv', 'lastNewsId', Math.max(thisId, maxId));
    }
  } catch (e) {
    // swallow errors
  }

  // Also check Security News
  try {
    const token = await idbGet<string>('comet-driver', 'kv', 'authToken');
    if (!token) return;
    const res = await fetch('/api/security-news', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return;

    const maxId = rows.reduce((m: number, n: any) => {
      const v = Number(n?.id) || 0; return v > m ? v : m;
    }, 0);
    const maxTime = rows.reduce((m: number, n: any) => {
      let t = 0; try { t = new Date(n?.date).getTime(); } catch { t = 0; }
      return Number.isFinite(t) && t > m ? t : m;
    }, 0);

    const lastSeenTime = (await idbGet<number>('comet-driver', 'kv', 'lastSecurityNewsTime')) || 0;
    const lastSeenId = (await idbGet<number>('comet-driver', 'kv', 'lastSecurityNewsId')) || 0;

    const hasNewByTime = Number.isFinite(maxTime) && maxTime > lastSeenTime;
    const hasNewById = Number.isFinite(maxId) && maxId > lastSeenId;

    if (hasNewByTime || hasNewById) {
      let latest: any = rows.find((n: any) => {
        try { return new Date(n.date).getTime() > lastSeenTime; } catch { return false; }
      });
      if (!latest && hasNewById) {
        latest = rows.find((n: any) => (Number(n?.id) || 0) > lastSeenId) || rows[0];
      }
      const rawTitle = (latest?.title || 'Nueva noticia de seguridad').toString();
      const rawDesc = (latest?.description || '').toString();
      const words = rawDesc.trim().split(/\s+/).filter(Boolean);
      const truncated = words.slice(0, 40);
      const preview = truncated.join(' ') + (words.length > 40 ? '' : '');
      const thisId = Number(latest?.id) || maxId || 0;
      await swSelf.registration.showNotification(rawTitle, {
        body: preview || 'Revisa las últimas noticias de seguridad.',
        tag: thisId ? `security-news-${thisId}` : 'security-news-update'
      });
      await idbSet('comet-driver', 'kv', 'lastSecurityNewsTime', maxTime || Date.now());
      if (thisId) await idbSet('comet-driver', 'kv', 'lastSecurityNewsId', Math.max(thisId, maxId));
    }
  } catch (e) {
    // swallow errors
  }
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

function startNewsChecks() {
  if (newsTimer) clearInterval(newsTimer);
  newsTimer = setInterval(checkNews, newsIntervalMs) as unknown as number;
  // prime once
  checkNews();
}

function stopNewsChecks() {
  if (newsTimer) clearInterval(newsTimer);
  newsTimer = undefined;
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
  } else if (data.type === 'UPDATE_AUTH_TOKEN') {
    const token = data.token;
    event.waitUntil(idbSet('comet-driver', 'kv', 'authToken', token).catch(()=>{}));
  } else if (data.type === 'START_NEWS_CHECK') {
    newsIntervalMs = typeof data.interval === 'number' ? data.interval : 60_000;
    startNewsChecks();
  } else if (data.type === 'STOP_NEWS_CHECK') {
    stopNewsChecks();
  } else if (data.type === 'TRIGGER_NEWS_CHECK') {
    event.waitUntil(checkNews());
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
  if (event?.tag && event.tag.startsWith('news-check')) {
    event.waitUntil(checkNews());
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
  if (event?.tag === 'news-check') {
    event.waitUntil(checkNews());
  }
});

swSelf.addEventListener('notificationclick', (event: any) => {
  event.notification?.close?.();
  event.waitUntil((async () => {
    try {
      const client = await getClient();
      if (client && 'focus' in client) {
        return (client as WindowClient).focus();
      }
      // fallback: open dashboard
      return swSelf.clients.openWindow?.('/dashboard');
    } catch {}
  })());
});
