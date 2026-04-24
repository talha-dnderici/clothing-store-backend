/**
 * Lightweight API client that talks to the backend gateway.
 * Pages consume backend data directly and surface failures in the UI.
 */

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000');

async function request<T = any>(
  path: string,
  options?: RequestInit,
  token?: string,
): Promise<{ data: T }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    const message = errorBody?.message || `API ${res.status}`;
    throw new Error(Array.isArray(message) ? message.join(', ') : message);
  }
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
  getCategories() {
    return request('/categories');
  },

  // Auth
  login(body: { email: string; password: string }) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  register(body: Record<string, string>) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },
  createUser(body: Record<string, unknown>) {
    return request('/users', { method: 'POST', body: JSON.stringify(body) });
  },

  // Cards
  getCards() {
    return request('/cards');
  },
  createCard(body: Record<string, unknown>) {
    return request('/cards', { method: 'POST', body: JSON.stringify(body) });
  },
  addItemToCart(body: Record<string, unknown>) {
    return request('/cart/items', { method: 'POST', body: JSON.stringify(body) });
  },
  checkout(token: string, body: Record<string, unknown>) {
    return request('/orders/checkout', { method: 'POST', body: JSON.stringify(body) }, token);
  },
  getMyOrders(token: string) {
    return request('/orders', undefined, token);
  },
  getManagerOrders(token: string) {
    return request('/manager/orders', undefined, token);
  },
  updateManagerOrderStatus(token: string, orderId: string, status: string) {
    return request(
      `/manager/orders/${orderId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    );
  },
  emailInvoice(token: string, orderId: string) {
    return request(
      `/orders/${orderId}/invoice/email`,
      { method: 'POST', body: JSON.stringify({}) },
      token,
    );
  },
  async downloadInvoicePdf(token: string, orderId: string) {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/invoice/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Invoice PDF ${res.status}`);
    return res.blob();
  },

  // Comments and ratings
  submitComment(token: string, productId: string, body: Record<string, unknown>) {
    return request(
      `/products/${productId}/comments`,
      { method: 'POST', body: JSON.stringify(body) },
      token,
    );
  },
  submitRating(token: string, productId: string, body: Record<string, unknown>) {
    return request(
      `/products/${productId}/ratings`,
      { method: 'POST', body: JSON.stringify(body) },
      token,
    );
  },
  submitReview(token: string, productId: string, body: Record<string, unknown>) {
    return request(
      `/products/${productId}/reviews`,
      { method: 'POST', body: JSON.stringify(body) },
      token,
    );
  },
  getProductComments(productId: string) {
    return request(`/products/${productId}/comments`);
  },
  getProductRatings(productId: string) {
    return request(`/products/${productId}/ratings`);
  },
  getManagerComments(token: string, status = 'pending') {
    return request(`/manager/comments?status=${encodeURIComponent(status)}`, undefined, token);
  },
  reviewComment(token: string, commentId: string, approvalStatus: 'approved' | 'rejected') {
    return request(
      `/manager/comments/${commentId}`,
      { method: 'PATCH', body: JSON.stringify({ approvalStatus }) },
      token,
    );
  },
  updateProductPricing(token: string, productId: string, body: Record<string, unknown>) {
    return request(
      `/manager/products/${productId}/pricing`,
      { method: 'PATCH', body: JSON.stringify(body) },
      token,
    );
  },
};
