export async function api(path: string, options: RequestInit = {}, throwOnError = false) {
  const token = localStorage.getItem('authToken');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const baseHeaders: Record<string, string> = {};
  if (!isFormData) baseHeaders['Content-Type'] = 'application/json';
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;
  const mergedHeaders: HeadersInit = { ...baseHeaders, ...(options.headers as any || {}) };
  
  // Use relative /api for same-origin, or full URL if API_URL is set
  const apiBaseUrl = import.meta.env.VITE_API_URL || '';
  const fullUrl = apiBaseUrl ? `${apiBaseUrl}/api${path}` : `/api${path}`;
  
  const res = await fetch(fullUrl, { headers: mergedHeaders, ...options });
  if (throwOnError && !res.ok) throw new Error(await res.text());
  return res;
}
