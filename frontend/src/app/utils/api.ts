/**
 * Lightweight API client that talks to the backend gateway.
 * Pages consume backend data directly and surface failures in the UI.
 */

export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : 'http://localhost:3000');

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
}

async function request<T = any>(
  path: string,
  options?: RequestInit,
  token?: string,
): Promise<{ data: T }> {
  // Authenticated endpoints (cart, orders, wishlist, ...) require the JWT.
  // Fall back to the session token so call sites cannot accidentally send
  // unauthenticated requests after the gateway auth hardening.
  const authToken = token ?? getStoredToken() ?? undefined;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
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
  createCategory(token: string, body: Record<string, unknown>) {
    return request('/categories', { method: 'POST', body: JSON.stringify(body) }, token);
  },
  createProduct(token: string, body: Record<string, unknown>) {
    return request('/products', { method: 'POST', body: JSON.stringify(body) }, token);
  },
  deleteProduct(token: string, productId: string) {
    return request(`/products/${productId}`, { method: 'DELETE' }, token);
  },
  deleteCategory(token: string, categoryId: string) {
    return request(`/categories/${categoryId}`, { method: 'DELETE' }, token);
  },
  getLowStockProducts(token: string, threshold = 5) {
    return request(`/manager/products/low-stock?threshold=${threshold}`, undefined, token);
  },

  // Auth
  login(body: { email: string; password: string }) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(body) });
  },
  register(body: Record<string, string>) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(body) });
  },
  createUser(body: Record<string, unknown>, token?: string) {
    return request('/users', { method: 'POST', body: JSON.stringify(body) }, token);
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
  clearCart(userId: string) {
    return request(`/cart/${userId}`, { method: 'DELETE' });
  },
  checkout(token: string, body: Record<string, unknown>) {
    return request('/orders/checkout', { method: 'POST', body: JSON.stringify(body) }, token);
  },
  getMyOrders(token: string) {
    return request('/orders', undefined, token);
  },
  cancelOrder(token: string, orderId: string) {
    return request(`/orders/${orderId}/cancel`, { method: 'POST' }, token);
  },
  createRefundRequest(
    token: string,
    orderId: string,
    body: { productId: string; quantity: number; reason?: string },
  ) {
    return request(
      `/orders/${orderId}/refunds`,
      { method: 'POST', body: JSON.stringify(body) },
      token,
    );
  },
  updateOrderStatus(token: string, orderId: string, status: string) {
    return request(
      `/orders/${orderId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    );
  },
  getManagerOrders(token: string) {
    return request('/manager/orders', undefined, token);
  },
  getMyRefundRequests(token: string) {
    return request('/refund-requests/my', undefined, token);
  },
  getManagerRefundRequests(token: string, status?: string) {
    const qs = status ? `?status=${encodeURIComponent(status)}` : '';
    return request(`/manager/refund-requests${qs}`, undefined, token);
  },
  updateManagerRefundRequest(
    token: string,
    refundId: string,
    status: 'approved' | 'rejected' | 'completed',
    decisionNote?: string,
  ) {
    return request(
      `/manager/refund-requests/${refundId}`,
      { method: 'PATCH', body: JSON.stringify({ status, decisionNote }) },
      token,
    );
  },
  updateManagerOrderStatus(token: string, orderId: string, status: string) {
    return request(
      `/manager/orders/${orderId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    );
  },
  getDeliveries(token: string) {
    return request('/deliveries', undefined, token);
  },
  updateDeliveryStatus(token: string, deliveryId: string, status: string) {
    return request(
      `/deliveries/${deliveryId}/status`,
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
  updateProductStock(token: string, productId: string, body: { stock?: number; adjustment?: number }) {
    return request(
      `/manager/products/${productId}/stock`,
      { method: 'PATCH', body: JSON.stringify(body) },
      token,
    );
  },
  getWishlist(token: string) {
    return request('/wishlist', undefined, token);
  },
  addWishlistItem(token: string, productId: string) {
    return request(
      '/wishlist/items',
      { method: 'POST', body: JSON.stringify({ productId }) },
      token,
    );
  },
  removeWishlistItem(token: string, productId: string) {
    return request(`/wishlist/items/${productId}`, { method: 'DELETE' }, token);
  },
  getNotifications(token: string, unreadOnly = false) {
    const qs = unreadOnly ? '?unreadOnly=true' : '';
    return request(`/notifications${qs}`, undefined, token);
  },
  markNotificationRead(token: string, notificationId: string) {
    return request(`/notifications/${notificationId}/read`, { method: 'PATCH' }, token);
  },
};
