// Global fetch wrapper to automatically attach Authorization for /api calls
// and clear stale tokens on 401 responses.

function shouldAttachAuth(url: string): boolean {
  try {
    // Same-origin relative /api, or absolute pointing to dev origins
    if (url.startsWith('/api')) return true;
    const u = new URL(url, window.location.origin);
    return u.pathname.startsWith('/api');
  } catch {
    return false;
  }
}

function mergeHeaders(existing: HeadersInit | undefined, extra: Record<string, string>): HeadersInit {
  const h = new Headers(existing as any);
  for (const [k, v] of Object.entries(extra)) {
    if (!h.has(k)) h.set(k, v);
  }
  return h as any;
}

const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  let nextInit: RequestInit = { ...(init || {}) };
  if (shouldAttachAuth(url)) {
    const token = localStorage.getItem('authToken');
    if (token) {
      nextInit.headers = mergeHeaders(nextInit.headers || (input as any)?.headers, { 'Authorization': `Bearer ${token}` });
    }
  }
  const res = await originalFetch(input as any, nextInit);
  if (res.status === 401) {
    // Clear stale creds so next attempt will redirect/login cleanly
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    // Optional: broadcast an event so UI can react
    try { window.dispatchEvent(new CustomEvent('auth:unauthorized')); } catch {}
  }
  return res;
};
