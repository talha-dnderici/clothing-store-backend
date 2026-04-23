import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Database,
  Play,
  RefreshCw,
  Server,
  Trash2,
  XCircle,
} from 'lucide-react';
import { BASE_URL } from '../utils/api';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type LoginState = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  session?: {
    id: string;
  };
};

type EndpointResult = {
  status: 'idle' | 'running' | 'ok' | 'error';
  statusCode?: number;
  message?: string;
  updatedAt?: string;
};

type EndpointDefinition = {
  key: string;
  group: string;
  method: HttpMethod;
  path: string;
  label: string;
  run: () => Promise<unknown>;
};

type ApiResult<T = any> = {
  status: number;
  data: T;
};

type Memory = Record<string, any>;

const customerCredentials = {
  email: 'customer@aura.test',
  password: 'password123',
};

const managerCredentials = {
  email: 'manager@aura.test',
  password: 'password123',
};

function nowStamp() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

function idOf(value: any): string {
  return String(value?.id ?? value?._id ?? '');
}

function shortValue(value: unknown) {
  if (typeof value === 'string') {
    return value.length > 22 ? `${value.slice(0, 22)}...` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  if (value && typeof value === 'object') {
    return 'object';
  }

  return 'empty';
}

export function EndpointTester() {
  const memoryRef = useRef<Memory>({});
  const [memorySnapshot, setMemorySnapshot] = useState<Memory>({});
  const [results, setResults] = useState<Record<string, EndpointResult>>({});
  const [activeKey, setActiveKey] = useState('');
  const [filter, setFilter] = useState('all');

  const saveMemory = (patch: Memory) => {
    memoryRef.current = {
      ...memoryRef.current,
      ...patch,
    };
    setMemorySnapshot({ ...memoryRef.current });
  };

  const clearMemory = () => {
    memoryRef.current = {};
    setMemorySnapshot({});
    setResults({});
  };

  const apiRequest = async <T,>(
    method: HttpMethod,
    path: string,
    options: {
      body?: unknown;
      token?: string;
      binary?: boolean;
    } = {},
  ): Promise<ApiResult<T>> => {
    const headers: Record<string, string> = {};

    if (options.token) {
      headers.Authorization = `Bearer ${options.token}`;
    }

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const contentType = response.headers.get('content-type') ?? '';
    const data = options.binary
      ? {
          contentType,
          bytes: (await response.blob()).size,
        }
      : contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : await response.text();

    if (!response.ok) {
      const errorMessage =
        typeof data === 'object' && data && 'message' in data
          ? Array.isArray((data as { message?: unknown }).message)
            ? ((data as { message: string[] }).message).join(', ')
            : String((data as { message?: unknown }).message)
          : `${method} ${path} failed`;

      throw new Error(errorMessage);
    }

    return {
      status: response.status,
      data: data as T,
    };
  };

  const createUser = async (role: 'customer' | 'productManager', prefix: string) => {
    const stamp = nowStamp();
    const email = `${prefix}.${stamp}@aura.test`;
    const response = await apiRequest<any>('POST', '/users', {
      body: {
        name: `${prefix} ${stamp}`,
        email,
        password: 'password123',
        taxId: `TR-${stamp}`,
        address: 'Endpoint Test Street 1',
        role,
      },
    });

    return response.data;
  };

  const login = async (credentials: { email: string; password: string }) => {
    const response = await apiRequest<any>('POST', '/auth/login', {
      body: credentials,
    });
    return response.data as LoginState;
  };

  const ensureSeedUser = async (
    kind: 'customer' | 'manager',
  ): Promise<LoginState> => {
    const memoryKey = `${kind}Login`;
    const existing = memoryRef.current[memoryKey] as LoginState | undefined;

    if (existing?.token && existing.user?.id) {
      return existing;
    }

    const credentials =
      kind === 'customer' ? customerCredentials : managerCredentials;

    try {
      const loggedIn = await login(credentials);
      saveMemory({ [memoryKey]: loggedIn, [`${kind}Id`]: loggedIn.user.id });
      return loggedIn;
    } catch {
      await apiRequest('POST', '/users', {
        body: {
          name: kind === 'customer' ? 'AURA Customer' : 'AURA Manager',
          email: credentials.email,
          password: credentials.password,
          taxId: kind === 'customer' ? 'TR-CUSTOMER-001' : 'TR-MANAGER-001',
          address:
            kind === 'customer'
              ? 'Istanbul Test Street 42'
              : 'AURA Operations Office',
          role: kind === 'customer' ? 'customer' : 'productManager',
        },
      }).catch((error) => {
        if (!String(error?.message ?? '').toLowerCase().includes('already')) {
          throw error;
        }
      });

      const loggedIn = await login(credentials);
      saveMemory({ [memoryKey]: loggedIn, [`${kind}Id`]: loggedIn.user.id });
      return loggedIn;
    }
  };

  const createSession = async () => {
    const session = await login(customerCredentials);
    saveMemory({
      sessionId: session.session?.id,
      customerLogin: session,
      customerId: session.user.id,
    });
    return session.session?.id ?? '';
  };

  const ensureCategory = async () => {
    if (memoryRef.current.categoryId) {
      return String(memoryRef.current.categoryId);
    }

    const stamp = nowStamp();
    const response = await apiRequest<any>('POST', '/categories', {
      body: {
        name: `Endpoint Category ${stamp}`,
        description: 'Created by the endpoint tester.',
        slug: `endpoint-category-${stamp}`,
        isActive: true,
      },
    });
    const categoryId = idOf(response.data);
    saveMemory({ categoryId });
    return categoryId;
  };

  const createDisposableCategory = async () => {
    const stamp = nowStamp();
    const response = await apiRequest<any>('POST', '/categories', {
      body: {
        name: `Delete Category ${stamp}`,
        description: 'Disposable category.',
        slug: `delete-category-${stamp}`,
        isActive: true,
      },
    });
    return idOf(response.data);
  };

  const ensureProduct = async () => {
    if (memoryRef.current.productId) {
      return String(memoryRef.current.productId);
    }

    const categoryId = await ensureCategory();
    const stamp = nowStamp();
    const response = await apiRequest<any>('POST', '/products', {
      body: {
        name: `Endpoint Hoodie ${stamp}`,
        model: `END-HOOD-${stamp}`,
        serialNumber: `END-SN-${stamp}`,
        description: 'Endpoint test product with enough stock.',
        categoryIds: [categoryId],
        price: 79,
        stock: 500,
        warrantyStatus: false,
        distributor: 'Endpoint Lab',
        discountRate: 5,
        discountActive: true,
        popularity: 50,
        imageUrl:
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      },
    });
    const productId = idOf(response.data);
    saveMemory({ productId });
    return productId;
  };

  const createDisposableProduct = async () => {
    const categoryId = await ensureCategory();
    const stamp = nowStamp();
    const response = await apiRequest<any>('POST', '/products', {
      body: {
        name: `Delete Product ${stamp}`,
        model: `DEL-PROD-${stamp}`,
        serialNumber: `DEL-SN-${stamp}`,
        description: 'Disposable product.',
        categoryIds: [categoryId],
        price: 21,
        stock: 20,
        warrantyStatus: false,
        distributor: 'Endpoint Lab',
        discountRate: 0,
        discountActive: false,
        popularity: 1,
        imageUrl: 'https://via.placeholder.com/400',
      },
    });
    return idOf(response.data);
  };

  const ensureCard = async () => {
    if (memoryRef.current.cardId) {
      return String(memoryRef.current.cardId);
    }

    const customer = await ensureSeedUser('customer');
    const productId = await ensureProduct();
    const response = await apiRequest<any>('POST', '/cards', {
      body: {
        userId: customer.user.id,
        status: 'abandoned',
        items: [
          {
            productId,
            quantity: 1,
            selectedSize: 'M',
            selectedColor: 'Endpoint Black',
          },
        ],
      },
    });
    const cardId = idOf(response.data);
    saveMemory({ cardId });
    return cardId;
  };

  const createDisposableCard = async () => {
    const customer = await ensureSeedUser('customer');
    const productId = await ensureProduct();
    const response = await apiRequest<any>('POST', '/cards', {
      body: {
        userId: customer.user.id,
        status: 'abandoned',
        items: [
          {
            productId,
            quantity: 1,
            selectedSize: 'L',
            selectedColor: `Disposable ${nowStamp()}`,
          },
        ],
      },
    });
    return idOf(response.data);
  };

  const addUniqueCartItem = async () => {
    const customer = await ensureSeedUser('customer');
    const productId = await ensureProduct();
    const selectedSize = `S-${nowStamp()}`;
    const selectedColor = `Endpoint ${nowStamp()}`;

    await apiRequest('POST', '/cart/items', {
      body: {
        userId: customer.user.id,
        productId,
        quantity: 1,
        selectedSize,
        selectedColor,
      },
    });

    saveMemory({
      cartProductId: productId,
      cartSelectedSize: selectedSize,
      cartSelectedColor: selectedColor,
    });

    return {
      customer,
      productId,
      selectedSize,
      selectedColor,
    };
  };

  const createOrder = async () => {
    const customer = await ensureSeedUser('customer');
    const productId = await ensureProduct();

    await apiRequest('DELETE', `/cart/${customer.user.id}`).catch(() => undefined);
    await apiRequest('POST', '/cart/items', {
      body: {
        userId: customer.user.id,
        productId,
        quantity: 1,
        selectedSize: 'M',
        selectedColor: `Order ${nowStamp()}`,
      },
    });
    const response = await apiRequest<any>('POST', '/orders/checkout', {
      token: customer.token,
      body: {
        deliveryAddress: 'Endpoint Order Street 7',
      },
    });
    const orderId = idOf(response.data?.order);

    saveMemory({
      orderId,
      invoiceId: response.data?.invoice?.id,
      invoiceNumber: response.data?.invoice?.invoiceNumber,
    });

    return response.data;
  };

  const ensureOrder = async () => {
    if (memoryRef.current.orderId) {
      return String(memoryRef.current.orderId);
    }

    const order = await createOrder();
    return idOf(order.order);
  };

  const createPendingComment = async () => {
    const customer = await ensureSeedUser('customer');
    const productId = await ensureProduct();
    const response = await apiRequest<any>('POST', `/products/${productId}/comments`, {
      token: customer.token,
      body: {
        content: `Pending endpoint comment ${nowStamp()}`,
      },
    });
    const commentId = idOf(response.data);
    saveMemory({ commentId });
    return commentId;
  };

  const ensureDelivery = async () => {
    const manager = await ensureSeedUser('manager');
    const order = await createOrder();
    const orderId = idOf(order.order);
    const response = await apiRequest<any[]>('GET', '/deliveries', {
      token: manager.token,
    });
    const delivery = response.data.find((item) => item.orderId === orderId);
    const deliveryId = delivery?.deliveryId ?? '';

    saveMemory({ deliveryId, deliveryOrderId: orderId });
    return deliveryId;
  };

  const endpointDefinitions = useMemo<EndpointDefinition[]>(
    () => [
      {
        key: 'GET /',
        group: 'System',
        method: 'GET',
        path: '/',
        label: 'Health',
        run: () => apiRequest('GET', '/'),
      },
      {
        key: 'GET /playground',
        group: 'System',
        method: 'GET',
        path: '/playground',
        label: 'Playground info',
        run: () => apiRequest('GET', '/playground'),
      },
      {
        key: 'POST /auth/register',
        group: 'Auth',
        method: 'POST',
        path: '/auth/register',
        label: 'Register customer',
        run: async () => {
          const stamp = nowStamp();
          const response = await apiRequest<any>('POST', '/auth/register', {
            body: {
              name: `Registered ${stamp}`,
              email: `registered.${stamp}@aura.test`,
              password: 'password123',
              taxId: `TR-REG-${stamp}`,
              address: 'Registered Endpoint Street',
            },
          });
          saveMemory({ registeredUserId: idOf(response.data) });
          return response;
        },
      },
      {
        key: 'POST /auth/login',
        group: 'Auth',
        method: 'POST',
        path: '/auth/login',
        label: 'Login customer',
        run: () => ensureSeedUser('customer'),
      },
      {
        key: 'POST /users',
        group: 'Users',
        method: 'POST',
        path: '/users',
        label: 'Create user',
        run: async () => {
          const user = await createUser('customer', 'created.user');
          saveMemory({ userId: idOf(user) });
          return user;
        },
      },
      {
        key: 'GET /users',
        group: 'Users',
        method: 'GET',
        path: '/users',
        label: 'List users',
        run: () => apiRequest('GET', '/users'),
      },
      {
        key: 'GET /users/:id',
        group: 'Users',
        method: 'GET',
        path: '/users/:id',
        label: 'Get user',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          return apiRequest('GET', `/users/${customer.user.id}`);
        },
      },
      {
        key: 'PATCH /users/:id',
        group: 'Users',
        method: 'PATCH',
        path: '/users/:id',
        label: 'Update user',
        run: async () => {
          const userId =
            memoryRef.current.userId || idOf(await createUser('customer', 'patch.user'));
          saveMemory({ userId });
          return apiRequest('PATCH', `/users/${userId}`, {
            body: {
              name: `Patched User ${nowStamp()}`,
              address: 'Patched Endpoint Avenue',
            },
          });
        },
      },
      {
        key: 'DELETE /users/:id',
        group: 'Users',
        method: 'DELETE',
        path: '/users/:id',
        label: 'Delete user',
        run: async () => {
          const user = await createUser('customer', 'delete.user');
          return apiRequest('DELETE', `/users/${idOf(user)}`);
        },
      },
      {
        key: 'GET /sessions',
        group: 'Sessions',
        method: 'GET',
        path: '/sessions',
        label: 'List sessions',
        run: () => apiRequest('GET', '/sessions'),
      },
      {
        key: 'GET /sessions/:id',
        group: 'Sessions',
        method: 'GET',
        path: '/sessions/:id',
        label: 'Get session',
        run: async () => apiRequest('GET', `/sessions/${await createSession()}`),
      },
      {
        key: 'PATCH /sessions/:id',
        group: 'Sessions',
        method: 'PATCH',
        path: '/sessions/:id',
        label: 'Update session',
        run: async () =>
          apiRequest('PATCH', `/sessions/${await createSession()}`, {
            body: { isActive: false },
          }),
      },
      {
        key: 'DELETE /sessions/:id',
        group: 'Sessions',
        method: 'DELETE',
        path: '/sessions/:id',
        label: 'Delete session',
        run: async () => apiRequest('DELETE', `/sessions/${await createSession()}`),
      },
      {
        key: 'POST /categories',
        group: 'Catalog',
        method: 'POST',
        path: '/categories',
        label: 'Create category',
        run: async () => {
          saveMemory({ categoryId: '' });
          return ensureCategory();
        },
      },
      {
        key: 'GET /categories',
        group: 'Catalog',
        method: 'GET',
        path: '/categories',
        label: 'List categories',
        run: () => apiRequest('GET', '/categories'),
      },
      {
        key: 'GET /categories/:id',
        group: 'Catalog',
        method: 'GET',
        path: '/categories/:id',
        label: 'Get category',
        run: async () => apiRequest('GET', `/categories/${await ensureCategory()}`),
      },
      {
        key: 'PATCH /categories/:id',
        group: 'Catalog',
        method: 'PATCH',
        path: '/categories/:id',
        label: 'Update category',
        run: async () =>
          apiRequest('PATCH', `/categories/${await ensureCategory()}`, {
            body: {
              description: `Updated by endpoint tester ${nowStamp()}`,
              isActive: true,
            },
          }),
      },
      {
        key: 'DELETE /categories/:id',
        group: 'Catalog',
        method: 'DELETE',
        path: '/categories/:id',
        label: 'Delete category',
        run: async () =>
          apiRequest('DELETE', `/categories/${await createDisposableCategory()}`),
      },
      {
        key: 'POST /products',
        group: 'Products',
        method: 'POST',
        path: '/products',
        label: 'Create product',
        run: async () => {
          saveMemory({ productId: '' });
          return ensureProduct();
        },
      },
      {
        key: 'GET /products',
        group: 'Products',
        method: 'GET',
        path: '/products',
        label: 'List products',
        run: () => apiRequest('GET', '/products?limit=12&sort=latest'),
      },
      {
        key: 'GET /products/:id',
        group: 'Products',
        method: 'GET',
        path: '/products/:id',
        label: 'Get product',
        run: async () => apiRequest('GET', `/products/${await ensureProduct()}`),
      },
      {
        key: 'PATCH /products/:id',
        group: 'Products',
        method: 'PATCH',
        path: '/products/:id',
        label: 'Update product',
        run: async () =>
          apiRequest('PATCH', `/products/${await ensureProduct()}`, {
            body: {
              description: `Updated product ${nowStamp()}`,
              stock: 500,
              popularity: 88,
            },
          }),
      },
      {
        key: 'PATCH /manager/products/:id/pricing',
        group: 'Products',
        method: 'PATCH',
        path: '/manager/products/:id/pricing',
        label: 'Manager pricing',
        run: async () => {
          const manager = await ensureSeedUser('manager');
          return apiRequest('PATCH', `/manager/products/${await ensureProduct()}/pricing`, {
            token: manager.token,
            body: {
              price: 74,
              discountRate: 12,
              discountActive: true,
            },
          });
        },
      },
      {
        key: 'DELETE /products/:id',
        group: 'Products',
        method: 'DELETE',
        path: '/products/:id',
        label: 'Delete product',
        run: async () =>
          apiRequest('DELETE', `/products/${await createDisposableProduct()}`),
      },
      {
        key: 'POST /products/:id/comments',
        group: 'Feedback',
        method: 'POST',
        path: '/products/:id/comments',
        label: 'Submit comment',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          const productId = await ensureProduct();
          const response = await apiRequest<any>('POST', `/products/${productId}/comments`, {
            token: customer.token,
            body: {
              content: `Endpoint comment ${nowStamp()}`,
            },
          });
          saveMemory({ commentId: idOf(response.data) });
          return response;
        },
      },
      {
        key: 'POST /products/:id/ratings',
        group: 'Feedback',
        method: 'POST',
        path: '/products/:id/ratings',
        label: 'Submit rating',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          const productId = await ensureProduct();
          const response = await apiRequest<any>('POST', `/products/${productId}/ratings`, {
            token: customer.token,
            body: { rating: 5 },
          });
          saveMemory({ ratingId: idOf(response.data) });
          return response;
        },
      },
      {
        key: 'GET /products/:id/comments',
        group: 'Feedback',
        method: 'GET',
        path: '/products/:id/comments',
        label: 'Public comments',
        run: async () => apiRequest('GET', `/products/${await ensureProduct()}/comments`),
      },
      {
        key: 'GET /products/:id/ratings',
        group: 'Feedback',
        method: 'GET',
        path: '/products/:id/ratings',
        label: 'Product ratings',
        run: async () => apiRequest('GET', `/products/${await ensureProduct()}/ratings`),
      },
      {
        key: 'GET /manager/comments',
        group: 'Feedback',
        method: 'GET',
        path: '/manager/comments',
        label: 'Manager queue',
        run: async () => {
          await createPendingComment();
          const manager = await ensureSeedUser('manager');
          return apiRequest('GET', '/manager/comments?status=pending', {
            token: manager.token,
          });
        },
      },
      {
        key: 'PATCH /manager/comments/:id',
        group: 'Feedback',
        method: 'PATCH',
        path: '/manager/comments/:id',
        label: 'Approve comment',
        run: async () => {
          const manager = await ensureSeedUser('manager');
          return apiRequest('PATCH', `/manager/comments/${await createPendingComment()}`, {
            token: manager.token,
            body: { approvalStatus: 'approved' },
          });
        },
      },
      {
        key: 'POST /cards',
        group: 'Cards',
        method: 'POST',
        path: '/cards',
        label: 'Create card',
        run: async () => {
          saveMemory({ cardId: '' });
          return ensureCard();
        },
      },
      {
        key: 'GET /cards',
        group: 'Cards',
        method: 'GET',
        path: '/cards',
        label: 'List cards',
        run: () => apiRequest('GET', '/cards'),
      },
      {
        key: 'GET /cards/:id',
        group: 'Cards',
        method: 'GET',
        path: '/cards/:id',
        label: 'Get card',
        run: async () => apiRequest('GET', `/cards/${await ensureCard()}`),
      },
      {
        key: 'PATCH /cards/:id',
        group: 'Cards',
        method: 'PATCH',
        path: '/cards/:id',
        label: 'Update card',
        run: async () =>
          apiRequest('PATCH', `/cards/${await ensureCard()}`, {
            body: {
              status: 'abandoned',
              items: [
                {
                  productId: await ensureProduct(),
                  quantity: 2,
                  selectedSize: 'XL',
                  selectedColor: 'Updated Endpoint Black',
                },
              ],
            },
          }),
      },
      {
        key: 'DELETE /cards/:id',
        group: 'Cards',
        method: 'DELETE',
        path: '/cards/:id',
        label: 'Delete card',
        run: async () => apiRequest('DELETE', `/cards/${await createDisposableCard()}`),
      },
      {
        key: 'GET /cart/:userId',
        group: 'Cart',
        method: 'GET',
        path: '/cart/:userId',
        label: 'Active cart',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          return apiRequest('GET', `/cart/${customer.user.id}`);
        },
      },
      {
        key: 'POST /cart/items',
        group: 'Cart',
        method: 'POST',
        path: '/cart/items',
        label: 'Add cart item',
        run: async () => {
          const item = await addUniqueCartItem();
          return {
            productId: item.productId,
            selectedSize: item.selectedSize,
          };
        },
      },
      {
        key: 'PATCH /cart/items',
        group: 'Cart',
        method: 'PATCH',
        path: '/cart/items',
        label: 'Update cart item',
        run: async () => {
          const item = await addUniqueCartItem();
          return apiRequest('PATCH', '/cart/items', {
            body: {
              userId: item.customer.user.id,
              productId: item.productId,
              quantity: 2,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
            },
          });
        },
      },
      {
        key: 'DELETE /cart/items',
        group: 'Cart',
        method: 'DELETE',
        path: '/cart/items',
        label: 'Remove cart item',
        run: async () => {
          const item = await addUniqueCartItem();
          return apiRequest('DELETE', '/cart/items', {
            body: {
              userId: item.customer.user.id,
              productId: item.productId,
              selectedSize: item.selectedSize,
              selectedColor: item.selectedColor,
            },
          });
        },
      },
      {
        key: 'DELETE /cart/:userId',
        group: 'Cart',
        method: 'DELETE',
        path: '/cart/:userId',
        label: 'Clear cart',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          await addUniqueCartItem();
          return apiRequest('DELETE', `/cart/${customer.user.id}`);
        },
      },
      {
        key: 'POST /orders/checkout',
        group: 'Orders',
        method: 'POST',
        path: '/orders/checkout',
        label: 'Checkout',
        run: createOrder,
      },
      {
        key: 'POST /payments/mock',
        group: 'Orders',
        method: 'POST',
        path: '/payments/mock',
        label: 'Mock payment',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          return apiRequest('POST', '/payments/mock', {
            token: customer.token,
            body: {
              amount: 25,
              orderId: memoryRef.current.orderId,
            },
          });
        },
      },
      {
        key: 'GET /orders',
        group: 'Orders',
        method: 'GET',
        path: '/orders',
        label: 'My orders',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          await ensureOrder();
          return apiRequest('GET', '/orders', { token: customer.token });
        },
      },
      {
        key: 'GET /manager/orders',
        group: 'Orders',
        method: 'GET',
        path: '/manager/orders',
        label: 'Manager orders',
        run: async () => {
          const manager = await ensureSeedUser('manager');
          await ensureOrder();
          return apiRequest('GET', '/manager/orders', { token: manager.token });
        },
      },
      {
        key: 'PATCH /manager/orders/:id/status',
        group: 'Orders',
        method: 'PATCH',
        path: '/manager/orders/:id/status',
        label: 'Manager order status',
        run: async () => {
          const manager = await ensureSeedUser('manager');
          const order = await createOrder();
          return apiRequest('PATCH', `/manager/orders/${idOf(order.order)}/status`, {
            token: manager.token,
            body: { status: 'in-transit' },
          });
        },
      },
      {
        key: 'GET /orders/status/my',
        group: 'Orders',
        method: 'GET',
        path: '/orders/status/my',
        label: 'My order status',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          await ensureOrder();
          return apiRequest('GET', '/orders/status/my', { token: customer.token });
        },
      },
      {
        key: 'GET /orders/:id',
        group: 'Orders',
        method: 'GET',
        path: '/orders/:id',
        label: 'Get order',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          return apiRequest('GET', `/orders/${await ensureOrder()}`, {
            token: customer.token,
          });
        },
      },
      {
        key: 'PATCH /orders/:id/status',
        group: 'Orders',
        method: 'PATCH',
        path: '/orders/:id/status',
        label: 'Order status',
        run: async () => {
          const manager = await ensureSeedUser('manager');
          const order = await createOrder();
          return apiRequest('PATCH', `/orders/${idOf(order.order)}/status`, {
            token: manager.token,
            body: { status: 'in-transit' },
          });
        },
      },
      {
        key: 'GET /orders/:id/invoice',
        group: 'Invoices',
        method: 'GET',
        path: '/orders/:id/invoice',
        label: 'Get invoice',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          return apiRequest('GET', `/orders/${await ensureOrder()}/invoice`, {
            token: customer.token,
          });
        },
      },
      {
        key: 'GET /orders/:id/invoice/pdf',
        group: 'Invoices',
        method: 'GET',
        path: '/orders/:id/invoice/pdf',
        label: 'Invoice PDF',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          return apiRequest('GET', `/orders/${await ensureOrder()}/invoice/pdf`, {
            token: customer.token,
            binary: true,
          });
        },
      },
      {
        key: 'POST /orders/:id/invoice/email',
        group: 'Invoices',
        method: 'POST',
        path: '/orders/:id/invoice/email',
        label: 'Email invoice',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          return apiRequest('POST', `/orders/${await ensureOrder()}/invoice/email`, {
            token: customer.token,
          });
        },
      },
      {
        key: 'GET /deliveries',
        group: 'Deliveries',
        method: 'GET',
        path: '/deliveries',
        label: 'List deliveries',
        run: async () => {
          const manager = await ensureSeedUser('manager');
          await ensureOrder();
          return apiRequest('GET', '/deliveries', { token: manager.token });
        },
      },
      {
        key: 'PATCH /deliveries/:id/status',
        group: 'Deliveries',
        method: 'PATCH',
        path: '/deliveries/:id/status',
        label: 'Delivery status',
        run: async () => {
          const manager = await ensureSeedUser('manager');
          return apiRequest('PATCH', `/deliveries/${await ensureDelivery()}/status`, {
            token: manager.token,
            body: { status: 'in-transit' },
          });
        },
      },
      {
        key: 'GET /deliveries/my',
        group: 'Deliveries',
        method: 'GET',
        path: '/deliveries/my',
        label: 'My deliveries',
        run: async () => {
          const customer = await ensureSeedUser('customer');
          await ensureOrder();
          return apiRequest('GET', '/deliveries/my', { token: customer.token });
        },
      },
    ],
    [],
  );

  const groups = useMemo(
    () => ['all', ...Array.from(new Set(endpointDefinitions.map((item) => item.group)))],
    [endpointDefinitions],
  );
  const visibleEndpoints = endpointDefinitions.filter((endpoint) =>
    filter === 'all' ? true : endpoint.group === filter,
  );
  const okCount = Object.values(results).filter((result) => result.status === 'ok').length;
  const errorCount = Object.values(results).filter(
    (result) => result.status === 'error',
  ).length;

  const runEndpoint = async (endpoint: EndpointDefinition) => {
    setActiveKey(endpoint.key);
    setResults((current) => ({
      ...current,
      [endpoint.key]: {
        status: 'running',
      },
    }));

    try {
      const output = await endpoint.run();
      const statusCode =
        typeof output === 'object' &&
        output &&
        'status' in output &&
        typeof (output as ApiResult).status === 'number'
          ? (output as ApiResult).status
          : 200;

      setResults((current) => ({
        ...current,
        [endpoint.key]: {
          status: 'ok',
          statusCode,
          message: 'OK',
          updatedAt: new Date().toLocaleTimeString(),
        },
      }));
    } catch (error) {
      setResults((current) => ({
        ...current,
        [endpoint.key]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Request failed',
          updatedAt: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setActiveKey('');
    }
  };

  const runAllVisible = async () => {
    for (const endpoint of visibleEndpoints) {
      await runEndpoint(endpoint);
    }
  };

  return (
    <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-indigo-800">
            <Server size={14} />
            Endpoint Matrix
          </div>
          <h2 className="text-2xl font-extrabold text-stone-950">
            Backend endpoint tester
          </h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 font-bold text-emerald-800">
              {okCount} passed
            </span>
            <span className="rounded-md border border-rose-200 bg-rose-50 px-3 py-1 font-bold text-rose-800">
              {errorCount} failed
            </span>
            <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-1 font-bold text-stone-700">
              {endpointDefinitions.length} endpoints
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-bold text-stone-800"
          >
            {groups.map((group) => (
              <option key={group} value={group}>
                {group === 'all' ? 'All groups' : group}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={runAllVisible}
            disabled={Boolean(activeKey)}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-stone-950 px-4 text-sm font-extrabold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            <Play size={16} />
            Run Visible
          </button>
          <button
            type="button"
            onClick={clearMemory}
            disabled={Boolean(activeKey)}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
          >
            <Trash2 size={16} />
            Reset
          </button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
        <div className="overflow-hidden rounded-lg border border-stone-200">
          <div className="hidden grid-cols-[120px_1fr_1fr_130px_160px] gap-0 border-b border-stone-200 bg-stone-50 px-4 py-3 text-xs font-extrabold uppercase tracking-wider text-stone-500 md:grid">
            <div>Method</div>
            <div>Endpoint</div>
            <div>Check</div>
            <div>Status</div>
            <div className="text-right">Action</div>
          </div>

          <div className="divide-y divide-stone-200">
            {visibleEndpoints.map((endpoint) => {
              const result = results[endpoint.key] ?? { status: 'idle' };
              const isRunning = result.status === 'running';
              const methodClass =
                endpoint.method === 'GET'
                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                  : endpoint.method === 'POST'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : endpoint.method === 'PATCH'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200';

              return (
                <div
                  key={endpoint.key}
                  className="grid gap-3 px-4 py-3 md:grid-cols-[120px_1fr_1fr_130px_160px] md:items-center"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex min-w-20 justify-center rounded-md border px-2 py-1 text-xs font-extrabold ${methodClass}`}
                    >
                      {endpoint.method}
                    </span>
                    <span className="text-xs font-bold text-stone-400 md:hidden">
                      {endpoint.group}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-semibold text-stone-900">
                    {endpoint.path}
                  </div>
                  <div className="text-sm font-semibold text-stone-700">
                    {endpoint.label}
                  </div>
                  <div>
                    {result.status === 'ok' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800">
                        <CheckCircle2 size={14} />
                        {result.statusCode ?? 200}
                      </span>
                    ) : result.status === 'error' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-800">
                        <XCircle size={14} />
                        Error
                      </span>
                    ) : result.status === 'running' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-800">
                        <RefreshCw size={14} className="animate-spin" />
                        Running
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-bold text-stone-500">
                        Ready
                      </span>
                    )}
                  </div>
                  <div className="md:text-right">
                    <button
                      type="button"
                      onClick={() => runEndpoint(endpoint)}
                      disabled={Boolean(activeKey)}
                      className="inline-flex h-9 items-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-extrabold text-white hover:bg-stone-800 disabled:opacity-50"
                    >
                      {isRunning ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Play size={15} />
                      )}
                      Run
                    </button>
                  </div>
                  {result.status === 'error' && result.message ? (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-5">
                      {result.message}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="rounded-lg border border-stone-200 bg-[#fbfaf7] p-4">
          <div className="mb-3 flex items-center gap-2">
            <Database size={18} className="text-stone-700" />
            <h3 className="font-extrabold text-stone-950">Runtime memory</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(memorySnapshot).map(([key, value]) => (
              <div
                key={key}
                className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <div className="font-mono text-xs font-bold text-stone-500">{key}</div>
                <div className="mt-1 break-words font-semibold text-stone-900">
                  {shortValue(value)}
                </div>
              </div>
            ))}
            {!Object.keys(memorySnapshot).length ? (
              <div className="rounded-md border border-dashed border-stone-300 px-3 py-4 text-sm font-medium text-stone-500">
                Empty
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </section>
  );
}
