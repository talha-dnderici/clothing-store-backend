import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Mail,
  MessageSquare,
  PackageCheck,
  RefreshCw,
  Send,
  ShieldCheck,
  Star,
  Tag,
  XCircle,
} from 'lucide-react';
import { api } from '../utils/api';
import { EndpointTester } from '../components/EndpointTester';
import { mapProducts } from '../utils/mapProduct';
import { CatalogProduct } from '../types/catalog';

type LoginUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type LoginState = {
  token: string;
  user: LoginUser;
};

type CommentItem = {
  id: string;
  productId: string;
  customerName: string;
  content: string;
  rating?: number;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
};

type RatingSummary = {
  ratingAverage: number;
  ratingCount: number;
  ratings: Array<{
    id: string;
    customerName: string;
    rating: number;
    content?: string;
    commentStatus: string;
    createdAt?: string;
  }>;
};

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
};

type Order = {
  id: string;
  customerEmail: string;
  status: 'processing' | 'in-transit' | 'delivered' | 'cancelled' | 'refunded';
  totalPrice: number;
  items: OrderItem[];
  createdAt?: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  emailStatus: 'pending' | 'sent' | 'failed' | 'skipped';
  emailError?: string;
  emailedToCustomer: boolean;
  hasPdf: boolean;
};

type CheckoutResult = {
  order: Order;
  invoice: Invoice;
  deliveryStatus: string;
};

type LogEntry = {
  id: number;
  tone: 'ok' | 'error' | 'info';
  message: string;
};

const customerCredentials = {
  email: 'customer@aura.test',
  password: 'password123',
};

const managerCredentials = {
  email: 'manager@aura.test',
  password: 'password123',
};

function money(value: number) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function statusClass(status: string) {
  if (status === 'approved' || status === 'sent' || status === 'delivered') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (status === 'rejected' || status === 'failed') {
    return 'border-rose-200 bg-rose-50 text-rose-800';
  }

  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function nextOrderStatus(status: Order['status']) {
  if (status === 'processing') return 'in-transit';
  if (status === 'in-transit') return 'delivered';
  return null;
}

export default function Playground() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customer, setCustomer] = useState<LoginState | null>(null);
  const [manager, setManager] = useState<LoginState | null>(null);
  const [rating, setRating] = useState(5);
  const [commentRating, setCommentRating] = useState(0);
  const [commentText, setCommentText] = useState('Great fabric and fast delivery.');
  const [publicComments, setPublicComments] = useState<CommentItem[]>([]);
  const [pendingComments, setPendingComments] = useState<CommentItem[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    ratingAverage: 0,
    ratingCount: 0,
    ratings: [],
  });
  const [managerOrders, setManagerOrders] = useState<Order[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [discountInput, setDiscountInput] = useState('0');
  const [discountActive, setDiscountActive] = useState(false);
  const [busyAction, setBusyAction] = useState('');
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      id: Date.now(),
      tone: 'info',
      message: 'Playground ready.',
    },
  ]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const addLog = (message: string, tone: LogEntry['tone'] = 'ok') => {
    setLogEntries((entries) => [
      { id: Date.now() + Math.random(), tone, message },
      ...entries.slice(0, 7),
    ]);
  };

  const run = async (label: string, action: () => Promise<void>) => {
    setBusyAction(label);

    try {
      await action();
    } catch (error) {
      addLog(error instanceof Error ? error.message : 'Action failed', 'error');
    } finally {
      setBusyAction('');
    }
  };

  const ensureAccounts = async () => {
    const users = [
      {
        name: 'AURA Customer',
        email: customerCredentials.email,
        password: customerCredentials.password,
        address: 'Istanbul Test Street 42',
        taxId: 'TR-CUSTOMER-001',
        role: 'customer',
      },
      {
        name: 'AURA Manager',
        email: managerCredentials.email,
        password: managerCredentials.password,
        address: 'AURA Operations Office',
        taxId: 'TR-MANAGER-001',
        role: 'productManager',
      },
    ];

    for (const user of users) {
      await api.createUser(user).catch((error) => {
        if (!String(error?.message ?? '').toLowerCase().includes('already exists')) {
          throw error;
        }
      });
    }
  };

  const loadProducts = async () => {
    const response = await api.getProducts({ limit: '24' });
    const mappedProducts = mapProducts(
      ((response.data as { items?: unknown[] }).items ?? []) as any[],
    );
    setProducts(mappedProducts);

    if (!selectedProductId && mappedProducts[0]) {
      setSelectedProductId(mappedProducts[0].id);
    }
  };

  const refreshFeedback = async (productId = selectedProductId) => {
    if (!productId) return;

    const [ratingsResponse, commentsResponse] = await Promise.all([
      api.getProductRatings(productId),
      api.getProductComments(productId),
    ]);

    setRatingSummary(ratingsResponse.data as RatingSummary);
    setPublicComments(commentsResponse.data as CommentItem[]);

    if (manager?.token) {
      const managerComments = await api.getManagerComments(manager.token, 'pending');
      setPendingComments(managerComments.data as CommentItem[]);
    }
  };

  const refreshOrders = async () => {
    const tasks: Promise<void>[] = [];

    if (customer?.token) {
      tasks.push(
        api.getMyOrders(customer.token).then((response) => {
          setCustomerOrders(response.data as Order[]);
        }),
      );
    }

    if (manager?.token) {
      tasks.push(
        api.getManagerOrders(manager.token).then((response) => {
          setManagerOrders(response.data as Order[]);
        }),
      );
    }

    await Promise.all(tasks);
  };

  const loginAs = async (kind: 'customer' | 'manager') => {
    const credentials = kind === 'customer' ? customerCredentials : managerCredentials;

    try {
      const response = await api.login(credentials);
      const data = response.data as { token: string; user: LoginUser };
      const loginState = { token: data.token, user: data.user };

      if (kind === 'customer') setCustomer(loginState);
      else setManager(loginState);

      addLog(`${data.user.name} logged in.`, 'ok');
    } catch {
      await ensureAccounts();
      const response = await api.login(credentials);
      const data = response.data as { token: string; user: LoginUser };
      const loginState = { token: data.token, user: data.user };

      if (kind === 'customer') setCustomer(loginState);
      else setManager(loginState);

      addLog(`${data.user.name} created and logged in.`, 'ok');
    }
  };

  const submitRating = async () => {
    if (!customer || !selectedProduct) throw new Error('Customer login and product are required.');

    await api.submitRating(customer.token, selectedProduct.id, { rating });
    addLog('Rating published immediately.', 'ok');
    await Promise.all([refreshFeedback(selectedProduct.id), loadProducts()]);
  };

  const submitComment = async () => {
    if (!customer || !selectedProduct) throw new Error('Customer login and product are required.');

    const body: Record<string, unknown> = { content: commentText };
    if (commentRating > 0) body.rating = commentRating;

    await api.submitComment(customer.token, selectedProduct.id, body);
    addLog('Comment sent to manager approval.', 'ok');
    setCommentText('');
    await Promise.all([refreshFeedback(selectedProduct.id), loadProducts()]);
  };

  const reviewComment = async (
    commentId: string,
    approvalStatus: 'approved' | 'rejected',
  ) => {
    if (!manager) throw new Error('Manager login is required.');

    await api.reviewComment(manager.token, commentId, approvalStatus);
    addLog(`Comment ${approvalStatus}.`, approvalStatus === 'approved' ? 'ok' : 'info');
    await refreshFeedback();
  };

  const checkout = async () => {
    if (!customer || !selectedProduct) throw new Error('Customer login and product are required.');

    await api.addItemToCart({
      userId: customer.user.id,
      productId: selectedProduct.id,
      quantity: 1,
      selectedSize: 'M',
      selectedColor: 'Black',
    });
    const response = await api.checkout(customer.token, {
      deliveryAddress: 'Istanbul Test Street 42',
    });

    setCheckoutResult(response.data as CheckoutResult);
    addLog('Checkout complete. Invoice is ready.', 'ok');
    await refreshOrders();
    await loadProducts();
  };

  const resendInvoice = async (orderId: string) => {
    if (!customer) throw new Error('Customer login is required.');

    const response = await api.emailInvoice(customer.token, orderId);
    setCheckoutResult((current) =>
      current ? { ...current, invoice: response.data as Invoice } : current,
    );
    addLog('Invoice email sent.', 'ok');
  };

  const openInvoicePdf = async (orderId: string) => {
    if (!customer) throw new Error('Customer login is required.');

    const blob = await api.downloadInvoicePdf(customer.token, orderId);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  };

  const updateOrderStatus = async (order: Order) => {
    if (!manager) throw new Error('Manager login is required.');
    const nextStatus = nextOrderStatus(order.status);
    if (!nextStatus) throw new Error('Order is already delivered.');

    await api.updateManagerOrderStatus(manager.token, order.id, nextStatus);
    addLog(`Order moved to ${nextStatus}.`, 'ok');
    await refreshOrders();
  };

  const updatePricing = async () => {
    if (!manager || !selectedProduct) throw new Error('Manager login and product are required.');
    const price = Number(priceInput);
    const discountRate = Number(discountInput);

    if (Number.isNaN(price) || price < 0) throw new Error('Price is invalid.');
    if (Number.isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
      throw new Error('Discount must be between 0 and 100.');
    }

    await api.updateProductPricing(manager.token, selectedProduct.id, {
      price,
      discountRate,
      discountActive,
    });
    addLog('Product pricing updated.', 'ok');
    await loadProducts();
  };

  useEffect(() => {
    run('load-products', async () => {
      await loadProducts();
      addLog('Products loaded.', 'ok');
    });
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      refreshFeedback(selectedProductId).catch((error) => {
        addLog(error instanceof Error ? error.message : 'Feedback refresh failed.', 'error');
      });
    }
  }, [selectedProductId, manager?.token]);

  useEffect(() => {
    if (!selectedProduct) return;
    setPriceInput(String(selectedProduct.price));
    setDiscountInput(String(selectedProduct.discountRate));
    setDiscountActive(selectedProduct.discountActive);
  }, [selectedProduct]);

  useEffect(() => {
    refreshOrders().catch(() => undefined);
  }, [customer?.token, manager?.token]);

  return (
    <div className="bg-[#f7f4ef]">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-800">
              <ShieldCheck size={14} />
              Manager Playground
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-stone-950 sm:text-4xl">
              AURA operations test bench
            </h1>
            <div className="mt-5 grid max-w-3xl grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-lg border border-stone-200 bg-[#fffaf2] p-4">
                <div className="font-bold text-stone-900">Customer</div>
                <div className="mt-1 text-stone-600">customer@aura.test</div>
              </div>
              <div className="rounded-lg border border-stone-200 bg-[#f2fbf8] p-4">
                <div className="font-bold text-stone-900">Manager</div>
                <div className="mt-1 text-stone-600">manager@aura.test</div>
              </div>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-[#f4f7ff] p-4 font-bold text-stone-900 hover:border-indigo-300"
              >
                Mailpit
                <ExternalLink size={17} />
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-stone-950 p-4 text-white">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-bold">Run Log</div>
              <button
                type="button"
                onClick={() => setLogEntries([])}
                className="rounded-md border border-white/20 px-2 py-1 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Clear
              </button>
            </div>
            <div className="space-y-2">
              {logEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                    entry.tone === 'error'
                      ? 'border-rose-400/30 bg-rose-500/10 text-rose-100'
                      : entry.tone === 'info'
                        ? 'border-sky-400/30 bg-sky-500/10 text-sky-100'
                        : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100'
                  }`}
                >
                  {entry.tone === 'error' ? (
                    <XCircle className="mt-0.5 h-4 w-4 flex-none" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" />
                  )}
                  <span>{entry.message}</span>
                </div>
              ))}
              {!logEntries.length ? (
                <div className="rounded-md border border-white/10 px-3 py-2 text-sm text-white/50">
                  No events yet.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-stone-950">Access</h2>
                <p className="text-sm text-stone-500">password123</p>
              </div>
              <button
                type="button"
                onClick={() => run('ensure-accounts', ensureAccounts)}
                disabled={Boolean(busyAction)}
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Ensure
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => run('login-customer', () => loginAs('customer'))}
                disabled={Boolean(busyAction)}
                className="rounded-md bg-stone-950 px-4 py-3 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50"
              >
                Login Customer
              </button>
              <button
                type="button"
                onClick={() => run('login-manager', () => loginAs('manager'))}
                disabled={Boolean(busyAction)}
                className="rounded-md bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                Login Manager
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-stone-200 p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Customer
                </div>
                <div className="mt-1 font-semibold text-stone-900">
                  {customer?.user.name ?? 'Not logged in'}
                </div>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Manager
                </div>
                <div className="mt-1 font-semibold text-stone-900">
                  {manager?.user.name ?? 'Not logged in'}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-stone-950">Product</h2>
                <p className="text-sm text-stone-500">{products.length} loaded</p>
              </div>
              <button
                type="button"
                onClick={() => run('load-products', loadProducts)}
                disabled={Boolean(busyAction)}
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
              <select
                value={selectedProductId}
                onChange={(event) => setSelectedProductId(event.target.value)}
                className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-900"
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>

              <div className="rounded-lg border border-stone-200 bg-[#fffaf2] px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">
                    {selectedProduct ? money(selectedProduct.effectivePrice) : '$0.00'}
                  </span>
                  {selectedProduct?.discountActive ? (
                    <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                      {selectedProduct.discountRate}% off
                    </span>
                  ) : (
                    <span className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs font-bold text-stone-500">
                      No discount
                    </span>
                  )}
                </div>
                <div className="mt-1 text-stone-500">
                  Stock {selectedProduct?.stockQuantity ?? 0} / Rating{' '}
                  {ratingSummary.ratingAverage || selectedProduct?.rating || 0}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-extrabold text-stone-950">Ratings</h2>
            </div>

            <div className="mb-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`h-10 w-10 rounded-md border text-sm font-extrabold ${
                    value <= rating
                      ? 'border-amber-300 bg-amber-100 text-amber-900'
                      : 'border-stone-200 bg-white text-stone-400'
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => run('submit-rating', submitRating)}
              disabled={Boolean(busyAction)}
              className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-3 text-sm font-extrabold text-stone-950 hover:bg-amber-400 disabled:opacity-50"
            >
              <Send size={16} />
              Submit Rating
            </button>

            <div className="rounded-lg border border-stone-200 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-extrabold text-stone-950">
                    {ratingSummary.ratingAverage.toFixed(1)}
                  </div>
                  <div className="text-sm text-stone-500">
                    {ratingSummary.ratingCount} ratings
                  </div>
                </div>
                <div className="flex gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <Star
                      key={value}
                      size={18}
                      className={
                        value <= Math.round(ratingSummary.ratingAverage)
                          ? 'fill-amber-500'
                          : ''
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-teal-700" />
              <h2 className="text-xl font-extrabold text-stone-950">Comments</h2>
            </div>

            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              rows={4}
              className="mb-3 w-full rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900"
              placeholder="Write a comment"
            />

            <div className="mb-3 flex items-center gap-2">
              <select
                value={commentRating}
                onChange={(event) => setCommentRating(Number(event.target.value))}
                className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold"
              >
                <option value={0}>No rating</option>
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value}>
                    {value} stars
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => run('submit-comment', submitComment)}
                disabled={Boolean(busyAction) || !commentText.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                <Clock size={16} />
                Submit Comment
              </button>
            </div>

            <div className="space-y-3">
              {publicComments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-bold text-stone-900">{comment.customerName}</span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(comment.approvalStatus)}`}>
                      {comment.approvalStatus}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-stone-600">{comment.content}</p>
                </div>
              ))}
              {!publicComments.length ? (
                <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                  No approved comments.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-700" />
              <h2 className="text-xl font-extrabold text-stone-950">Approval</h2>
            </div>

            <button
              type="button"
              onClick={() => run('refresh-feedback', () => refreshFeedback())}
              disabled={Boolean(busyAction)}
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh Queue
            </button>

            <div className="space-y-3">
              {pendingComments.map((comment) => (
                <div key={comment.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-bold text-stone-900">{comment.customerName}</span>
                    <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(comment.approvalStatus)}`}>
                      {comment.approvalStatus}
                    </span>
                  </div>
                  <p className="mb-3 text-sm leading-6 text-stone-600">{comment.content}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => run('approve-comment', () => reviewComment(comment.id, 'approved'))}
                      className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => run('reject-comment', () => reviewComment(comment.id, 'rejected'))}
                      className="rounded-md bg-rose-600 px-3 py-2 text-sm font-bold text-white hover:bg-rose-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {!pendingComments.length ? (
                <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                  No pending comments.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-emerald-700" />
              <h2 className="text-xl font-extrabold text-stone-950">Checkout</h2>
            </div>

            <button
              type="button"
              onClick={() => run('checkout', checkout)}
              disabled={Boolean(busyAction)}
              className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-stone-950 px-4 py-3 text-sm font-extrabold text-white hover:bg-stone-800 disabled:opacity-50"
            >
              <PackageCheck size={17} />
              Add Item and Checkout
            </button>

            {checkoutResult ? (
              <div className="rounded-lg border border-stone-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-stone-950">
                      {checkoutResult.invoice.invoiceNumber}
                    </div>
                    <div className="text-sm text-stone-500">
                      {money(checkoutResult.order.totalPrice)}
                    </div>
                  </div>
                  <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(checkoutResult.invoice.emailStatus)}`}>
                    {checkoutResult.invoice.emailStatus}
                  </span>
                </div>
                {checkoutResult.invoice.emailError ? (
                  <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {checkoutResult.invoice.emailError}
                  </div>
                ) : null}
                <div className="grid gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() => run('open-pdf', () => openInvoicePdf(checkoutResult.order.id))}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold hover:bg-stone-50"
                  >
                    <FileText size={16} />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => run('resend-invoice', () => resendInvoice(checkoutResult.order.id))}
                    disabled={Boolean(busyAction) || checkoutResult.invoice.emailStatus === 'sent'}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold hover:bg-stone-50"
                  >
                    <Mail size={16} />
                    {checkoutResult.invoice.emailStatus === 'sent' ? 'Sent' : 'Email'}
                  </button>
                  <a
                    href="http://localhost:8025"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold hover:bg-stone-50"
                  >
                    <ExternalLink size={16} />
                    Inbox
                  </a>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                No checkout yet.
              </div>
            )}
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-indigo-700" />
                <h2 className="text-xl font-extrabold text-stone-950">Orders</h2>
              </div>
              <button
                type="button"
                onClick={() => run('refresh-orders', refreshOrders)}
                className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            <div className="space-y-3">
              {managerOrders.map((order) => {
                const nextStatus = nextOrderStatus(order.status);
                return (
                  <div key={order.id} className="rounded-lg border border-stone-200 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-stone-900">{order.customerEmail}</div>
                        <div className="text-sm text-stone-500">{money(order.totalPrice)}</div>
                      </div>
                      <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mb-3 text-sm text-stone-600">
                      {order.items.map((item) => `${item.quantity} x ${item.productName}`).join(', ')}
                    </div>
                    <button
                      type="button"
                      onClick={() => run('update-order', () => updateOrderStatus(order))}
                      disabled={!nextStatus}
                      className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800 disabled:bg-stone-200 disabled:text-stone-500"
                    >
                      {nextStatus ? `Move to ${nextStatus}` : 'Delivered'}
                    </button>
                  </div>
                );
              })}
              {!managerOrders.length ? (
                <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                  No manager orders loaded.
                </div>
              ) : null}
            </div>

            {customerOrders.length ? (
              <div className="mt-4 rounded-lg border border-stone-200 bg-[#f4f7ff] p-3 text-sm text-stone-700">
                Customer orders: {customerOrders.length}
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-rose-700" />
            <h2 className="text-xl font-extrabold text-stone-950">Manager Pricing</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Price
              </span>
              <div className="flex h-11 items-center gap-2 rounded-md border border-stone-300 px-3">
                <DollarSign size={16} className="text-stone-500" />
                <input
                  value={priceInput}
                  onChange={(event) => setPriceInput(event.target.value)}
                  className="w-full border-0 bg-transparent p-0 text-sm font-semibold outline-none"
                  inputMode="decimal"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                Discount
              </span>
              <input
                value={discountInput}
                onChange={(event) => setDiscountInput(event.target.value)}
                className="h-11 w-full rounded-md border border-stone-300 px-3 text-sm font-semibold"
                inputMode="decimal"
              />
            </label>

            <label className="flex h-full min-h-16 items-end">
              <span className="flex h-11 w-full items-center gap-3 rounded-md border border-stone-300 px-3 text-sm font-bold text-stone-800">
                <input
                  type="checkbox"
                  checked={discountActive}
                  onChange={(event) => setDiscountActive(event.target.checked)}
                  className="h-4 w-4 accent-rose-700"
                />
                Active discount
              </span>
            </label>

            <button
              type="button"
              onClick={() => run('update-pricing', updatePricing)}
              disabled={Boolean(busyAction)}
              className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-rose-700 px-4 text-sm font-extrabold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              <Tag size={16} />
              Update
            </button>
          </div>
        </section>

        <EndpointTester />
      </main>
    </div>
  );
}
