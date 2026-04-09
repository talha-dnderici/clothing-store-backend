const API_BASE_URL = 'http://localhost:3001/api';

export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'API request failed');
  }

  return res.json();
}

// Typed helpers
export const api = {
  getProducts: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ success: boolean; count: number; data: any[] }>(`/products${query}`);
  },

  getProduct: (id: string) =>
    apiFetch<{ success: boolean; data: any }>(`/products/${id}`),
};
