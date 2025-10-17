export async function api(path: string, options: RequestInit = {}, throwOnError = false) {
  const token = localStorage.getItem('authToken');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const baseHeaders: Record<string, string> = {};
  if (!isFormData) baseHeaders['Content-Type'] = 'application/json';
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;
  const mergedHeaders: HeadersInit = { ...baseHeaders, ...(options.headers as any || {}) };
  const res = await fetch(`/api${path}`, { headers: mergedHeaders, ...options });
  if (throwOnError && !res.ok) throw new Error(await res.text());
  return res;
}
