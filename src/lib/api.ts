export async function api(path: string, options: RequestInit = {}, throwOnError = false) {
  const token = localStorage.getItem('authToken');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const baseHeaders: Record<string, string> = {};
  if (!isFormData) baseHeaders['Content-Type'] = 'application/json';
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;
  const mergedHeaders: HeadersInit = { ...baseHeaders, ...(options.headers as any || {}) };
  
  // Always use relative /api path - Vercel will handle the routing
  // In development, this proxies to localhost:5000 via vite.config
  // In production on Vercel, this routes to the /api/index.js serverless function
  const fullUrl = `/api${path}`;
  
  const res = await fetch(fullUrl, { headers: mergedHeaders, ...options });
  if (throwOnError && !res.ok) throw new Error(await res.text());
  return res;
}
