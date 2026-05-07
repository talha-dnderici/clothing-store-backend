import React, { useEffect, useState, useMemo } from 'react';
import { Link, Navigate } from 'react-router';
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Mail,
  AlertCircle,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import { ReviewModal } from '../components/ReviewModal';

type OrderItem = {
  productId?: string;
  // Backend persists the product name on each order item as `productName`
  // (used by the invoice PDF). We accept the alternate `name` shape as a
  // fallback in case the API surface changes.
  productName?: string;
  name?: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  imageUrl?: string;
  productImage?: string;
  image?: string;
};

function getItemName(item: OrderItem): string {
  return item.productName ?? item.name ?? 'Product';
}

function getItemImage(item: OrderItem): string | undefined {
  return item.imageUrl ?? item.productImage ?? item.image;
}

type Order = {
  id?: string;
  _id?: string;
  customerEmail?: string;
  status: 'processing' | 'in-transit' | 'delivered' | 'cancelled' | 'refunded' | 'refund_requested';
  totalPrice?: number;
  total?: number;
  items?: OrderItem[];
  createdAt?: string;
  deliveryAddress?: string;
};

const RETURN_WINDOW_DAYS = 30;

function getOrderId(order: Order): string {
  return order.id || order._id || '';
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function daysSince(iso?: string): number {
  if (!iso) return Infinity;
  const ms = Date.now() - new Date(iso).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function StatusBadge({ status }: { status: Order['status'] }) {
  const config: Record<
    Order['status'],
    { label: string; cls: string; Icon: React.ComponentType<{ size?: number }> }
  > = {
    processing: {
      label: 'Processing',
      cls: 'bg-amber-50 text-amber-800 border-amber-200',
      Icon: Package,
    },
    'in-transit': {
      label: 'In Transit',
      cls: 'bg-blue-50 text-blue-800 border-blue-200',
      Icon: Truck,
    },
    delivered: {
      label: 'Delivered',
      cls: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      Icon: CheckCircle2,
    },
    cancelled: {
      label: 'Cancelled',
      cls: 'bg-gray-100 text-gray-700 border-gray-300',
      Icon: XCircle,
    },
    refunded: {
      label: 'Refunded',
      cls: 'bg-purple-50 text-purple-800 border-purple-200',
      Icon: RotateCcw,
    },
    refund_requested: {
      label: 'Refund Requested',
      cls: 'bg-purple-50 text-purple-700 border-purple-200',
      Icon: RotateCcw,
    },
  };
  const c = config[status] ?? config.processing;
  const { Icon } = c;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${c.cls}`}
      data-testid={`order-status-${status}`}
    >
      <Icon size={12} />
      {c.label}
    </span>
  );
}

function ProgressTracker({ status }: { status: Order['status'] }) {
  const steps: Order['status'][] = ['processing', 'in-transit', 'delivered'];
  const isFinal = status === 'cancelled' || status === 'refunded' || status === 'refund_requested';
  if (isFinal) return null;
  const currentIdx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-1 mt-3">
      {steps.map((step, i) => {
        const reached = i <= currentIdx;
        return (
          <React.Fragment key={step}>
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                reached ? 'bg-black' : 'bg-gray-200'
              }`}
            />
            {i < steps.length - 1 && <div className="w-1" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('token') ?? '' : '';
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    productId: string;
    productName: string;
    productImage?: string;
  } | null>(null);

  const loadOrders = useMemo(
    () => async () => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.getMyOrders(token);
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.items)
          ? (res.data as any).items
          : [];
        // Newest first
        list.sort((a: Order, b: Order) => {
          const da = new Date(a.createdAt ?? 0).getTime();
          const db = new Date(b.createdAt ?? 0).getTime();
          return db - da;
        });
        setOrders(list);
      } catch (err: any) {
        setError(err?.message || 'Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (!user) {
    return <Navigate to="/auth?redirect=/orders" replace />;
  }

  const handleCancel = async (orderId: string) => {
    if (!token) return;
    if (!window.confirm('Cancel this order? Stock will be returned automatically.')) return;
    setBusyId(orderId);
    try {
      await api.updateOrderStatus(token, orderId, 'cancelled');
      showToast({ title: 'Order cancelled', variant: 'success' });
      await loadOrders();
    } catch (err: any) {
      showToast({
        title: 'Could not cancel order',
        description: err?.message,
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleReturn = async (orderId: string) => {
    if (!token) return;
    if (
      !window.confirm(
        'Request a return / refund for this order? The sales team will review your request.',
      )
    )
      return;
    setBusyId(orderId);
    try {
      await api.updateOrderStatus(token, orderId, 'refund_requested');
      showToast({
        title: 'Refund requested',
        description: 'The sales team will be in touch shortly.',
        variant: 'success',
      });
      await loadOrders();
    } catch (err: any) {
      showToast({
        title: 'Could not submit refund request',
        description: err?.message,
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    if (!token) return;
    setBusyId(orderId);
    try {
      const blob = await api.downloadInvoicePdf(token, orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      showToast({
        title: 'Could not download invoice',
        description: err?.message,
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleEmailInvoice = async (orderId: string) => {
    if (!token) return;
    setBusyId(orderId);
    try {
      await api.emailInvoice(token, orderId);
      showToast({
        title: 'Invoice emailed',
        description: 'Check your inbox for the PDF copy.',
        variant: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Could not email invoice',
        description: err?.message,
        variant: 'error',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10" data-testid="orders-page">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
            <ShoppingBag size={26} /> My Orders
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your orders, cancel pending ones, or request a return within {RETURN_WINDOW_DAYS}{' '}
            days of delivery.
          </p>
        </div>
      </div>

      {loading && (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-gray-100 bg-gray-50"
            />
          ))}
        </div>
      )}

      {error && !loading && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 flex items-center gap-2"
        >
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <ShoppingBag size={40} className="mx-auto text-gray-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">No orders yet</h2>
          <p className="mt-1 text-sm text-gray-500">
            Once you place your first order, it will appear here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition"
          >
            Start shopping
          </Link>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <ul className="grid gap-5">
          {orders.map((order) => {
            const id = getOrderId(order);
            const total = order.totalPrice ?? order.total ?? 0;
            const itemCount = order.items?.reduce((acc, i) => acc + (i.quantity || 0), 0) ?? 0;
            const isCancellable = order.status === 'processing';
            const isReturnable =
              order.status === 'delivered' && daysSince(order.createdAt) <= RETURN_WINDOW_DAYS;
            const busy = busyId === id;

            return (
              <li
                key={id}
                className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                data-testid="order-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-mono text-gray-400">
                        #{id.slice(-8).toUpperCase()}
                      </span>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Placed on {formatDate(order.createdAt)} • {itemCount} item
                      {itemCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 tabular-nums">
                      ${Number(total).toFixed(2)}
                    </p>
                  </div>
                </div>

                <ProgressTracker status={order.status} />

                {/* Items preview */}
                {order.items && order.items.length > 0 && (
                  <ul className="mt-5 grid gap-2 border-t border-gray-100 pt-4">
                    {order.items.slice(0, 4).map((item, idx) => {
                      const canReview = order.status === 'delivered' && item.productId;
                      const itemName = getItemName(item);
                      const itemImage = getItemImage(item);
                      return (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-3 text-sm text-gray-700"
                        >
                          <span className="truncate flex-1 min-w-0">
                            {itemName} × {item.quantity}
                          </span>
                          <span className="font-medium tabular-nums shrink-0">
                            ${Number(
                              (item.unitPrice ?? item.price ?? 0) * item.quantity,
                            ).toFixed(2)}
                          </span>
                          {canReview && (
                            <button
                              type="button"
                              onClick={() =>
                                setReviewTarget({
                                  productId: item.productId!,
                                  productName: itemName,
                                  productImage: itemImage,
                                })
                              }
                              data-testid="review-product-btn"
                              className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100 transition shrink-0"
                            >
                              <Star size={11} className="fill-amber-400 text-amber-400" />
                              Review
                            </button>
                          )}
                        </li>
                      );
                    })}
                    {order.items.length > 4 && (
                      <li className="text-xs text-gray-400">
                        + {order.items.length - 4} more item
                        {order.items.length - 4 === 1 ? '' : 's'}
                      </li>
                    )}
                  </ul>
                )}

                {/* Action bar */}
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => handleDownloadInvoice(id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                    data-testid="download-invoice"
                  >
                    <Download size={13} /> Invoice PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEmailInvoice(id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                    data-testid="email-invoice"
                  >
                    <Mail size={13} /> Email me
                  </button>

                  <div className="ml-auto flex flex-wrap gap-2">
                    {isCancellable && (
                      <button
                        type="button"
                        onClick={() => handleCancel(id)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-4 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50 transition"
                        data-testid="cancel-order"
                      >
                        <XCircle size={13} /> Cancel order
                      </button>
                    )}
                    {isReturnable && (
                      <button
                        type="button"
                        onClick={() => handleReturn(id)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-4 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 disabled:opacity-50 transition"
                        data-testid="return-order"
                      >
                        <RotateCcw size={13} /> Request return
                      </button>
                    )}
                    {order.status === 'delivered' && !isReturnable && (
                      <span className="text-xs text-gray-400 italic self-center">
                        Return window closed
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {reviewTarget && (
        <ReviewModal
          isOpen={!!reviewTarget}
          productId={reviewTarget.productId}
          productName={reviewTarget.productName}
          productImage={reviewTarget.productImage}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
}
