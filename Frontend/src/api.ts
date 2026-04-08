const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:4000") as string;
  
  export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        ...(options.headers || {}),
      },
    });
  
    const data = await res.json().catch(() => null);
  
    if (!res.ok) {
      const msg = data?.message || `Request failed: ${res.status}`;
      throw new Error(msg);
    }
  
    return data as T;
  }
  
  export { API_BASE };