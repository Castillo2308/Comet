// Client helper to communicate with the service worker for background pings

export async function startServiceWorkerPings(intervalMs = 20_000) {
  const reg = await navigator.serviceWorker.ready.catch(() => undefined);
  const sw = reg?.active;
  if (sw) {
    sw.postMessage({ type: 'START_PINGS', interval: intervalMs });
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
}
