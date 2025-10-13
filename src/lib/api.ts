export async function api(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('authToken');
  const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) baseHeaders['Authorization'] = `Bearer ${token}`;
  const mergedHeaders: HeadersInit = { ...baseHeaders, ...(options.headers as any || {}) };
  const res = await fetch(`/api${path}`, { headers: mergedHeaders, ...options });
  if (!res.ok) throw new Error(await res.text());
  return res;
}
