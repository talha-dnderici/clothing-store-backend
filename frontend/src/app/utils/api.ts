/**
 * Lightweight API client that talks to the backend gateway.
 * When the backend is unreachable the pages fall back to local mock data,
 * so failures here are non-fatal.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function request<T = any>(path: string, options?: RequestInit): Promise<{ data: T }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const data = await res.json();
  return { data };
}

export const api = {
  // Products
  getProducts(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request(`/products${qs}`);
  },
  getProduct(id: string) {
    return request(`/products/${id}`);
  },

  // Auth
  login(body: { email: string; password: string }) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  register(body: Record<string, string>) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },

  // Cards
  getCards() {
    return request('/cards');
  },
  createCard(body: Record<string, unknown>) {
    return request('/cards', { method: 'POST', body: JSON.stringify(body) });
  },
};
