import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CheckSquare,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  FolderTree,
  ListChecks,
  Mail,
  MessageSquare,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Truck,
  Send,
  ShieldCheck,
  Square,
  Star,
  Tag,
  TrendingUp,
  Trash2,
  Undo2,
  X,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../utils/api';
import { EndpointTester } from '../components/EndpointTester';
import {
  DeletedCategorySnapshot,
  DeletedProductSnapshot,
  loadDeletedCategorySnapshot,
  loadDeletedProductSnapshot,
  notifyCatalogChanged,
  saveDeletedCategorySnapshot,
  saveDeletedProductSnapshot,
} from '../utils/catalogEvents';
import { mapProducts } from '../utils/mapProduct';
import { CatalogProduct } from '../types/catalog';
import { nextDeliveryStatus } from '../utils/deliveryStatus';

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

type Delivery = {
  id: string;
  deliveryId: string;
  orderId: string;
  customerId: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  deliveryAddress: string;
  status: 'processing' | 'in-transit' | 'delivered' | 'cancelled';
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

type RefundRequest = {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  refundedAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason?: string;
  customerId: string;
  createdAt?: string;
};

type ManagerInvoice = {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerEmail?: string;
  totalAmount: number;
  createdAt?: string;
  emailStatus?: string;
};

type RevenueReport = {
  invoiceCount: number;
  totalRevenue: number;
  chart: Array<{ date: string; revenue: number; invoiceCount: number }>;
};

type ProfitLossReport = {
  orderCount: number;
  totalRevenue: number;
  totalCost: number;
  profit: number;
  loss: number;
  chart: Array<{ date: string; revenue: number; cost: number; profit: number }>;
};

type LogEntry = {
  id: number;
  tone: 'ok' | 'error' | 'info';
  message: string;
};

type CategoryItem = {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
};

const customerCredentials = {
  email: 'customer@aura.test',
  password: 'password123',
};

const salesManagerCredentials = {
  email: 'sales.manager@aura.test',
  password: 'password123',
};

const productManagerCredentials = {
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function Playground() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customer, setCustomer] = useState<LoginState | null>(null);
  const [salesManager, setSalesManager] = useState<LoginState | null>(null);
  const [productManager, setProductManager] = useState<LoginState | null>(null);
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
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportInvoices, setReportInvoices] = useState<ManagerInvoice[]>([]);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);
  const [chartStartDate, setChartStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [chartEndDate, setChartEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [revenueReport, setRevenueReport] = useState<RevenueReport | null>(null);
  const [profitReport, setProfitReport] = useState<ProfitLossReport | null>(null);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [discountInput, setDiscountInput] = useState('0');
  const [discountActive, setDiscountActive] = useState(false);
  const [stockInput, setStockInput] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<CatalogProduct[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('Demo Collection');
  const [newCategoryDescription, setNewCategoryDescription] = useState(
    'Category created by the product manager during the demo.',
  );
  const [newProductName, setNewProductName] = useState('Product D');
  const [newProductDescription, setNewProductDescription] = useState(
    'New catalog item added live by the product manager.',
  );
  const [newProductStock, setNewProductStock] = useState('25');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [productToRemoveId, setProductToRemoveId] = useState('');
  const [lastDeletedCategory, setLastDeletedCategory] = useState<DeletedCategorySnapshot | null>(
    () => loadDeletedCategorySnapshot(),
  );
  const [lastDeletedProduct, setLastDeletedProduct] = useState<DeletedProductSnapshot | null>(
    () => loadDeletedProductSnapshot(),
  );
  const [busyAction, setBusyAction] = useState('');
  const [bulkApproveMode, setBulkApproveMode] = useState(false);
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set());
  const [bulkAdvanceMode, setBulkAdvanceMode] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [logEntries, setLogEntries] = useState<LogEntry[]>([
    {
      id: Date.now(),
      tone: 'info',
      message: 'Operations Console ready.',
    },
  ]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId],
  );

  const productToRemove = useMemo(
    () => products.find((product) => product.id === productToRemoveId) ?? null,
    [products, productToRemoveId],
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
    await api.login(customerCredentials).catch(async () => {
      await api.register({
        name: 'AURA Customer',
        email: customerCredentials.email,
        password: customerCredentials.password,
        address: 'Istanbul Test Street 42',
        taxId: 'TR-CUSTOMER-001',
      });
      await api.login(customerCredentials);
    });

    await api.login(salesManagerCredentials).catch(() => {
      throw new Error('Sales manager seed user is missing. Run the seed script first.');
    });

    await api.login(productManagerCredentials).catch(() => {
      throw new Error(
        'Product manager account is missing. Run `npm run seed:db` to create manager@aura.test.',
      );
    });

    addLog('Accounts verified.', 'ok');
  };

  const loadProducts = async () => {
    const response = await api.getProducts({ limit: '100' });
    const mappedProducts = mapProducts(
      ((response.data as { items?: unknown[] }).items ?? []) as any[],
    );
    setProducts(mappedProducts);

    if (!selectedProductId && mappedProducts[0]) {
      setSelectedProductId(mappedProducts[0].id);
    } else if (
      selectedProductId &&
      !mappedProducts.some((product) => product.id === selectedProductId) &&
      mappedProducts[0]
    ) {
      setSelectedProductId(mappedProducts[0].id);
    }
  };

  const loadCategories = async () => {
    const response = await api.getCategories();
    const list = Array.isArray(response.data) ? (response.data as CategoryItem[]) : [];
    setCategories(list);
    if (!newProductCategoryId && list[0]) {
      setNewProductCategoryId(list[0].id);
    }
  };

  const loadLowStockProducts = async () => {
    if (!productManager?.token) return;
    const response = await api.getLowStockProducts(productManager.token, 5);
    setLowStockProducts(mapProducts((response.data as unknown[]) ?? []));
  };

  const refreshCatalog = async () => {
    await Promise.all([
      loadCategories(),
      loadProducts(),
      productManager?.token ? loadLowStockProducts() : Promise.resolve(),
    ]);
    notifyCatalogChanged();
  };

  const rememberDeletedCategory = (snapshot: DeletedCategorySnapshot) => {
    setLastDeletedCategory(snapshot);
    saveDeletedCategorySnapshot(snapshot);
  };

  const rememberDeletedProduct = (snapshot: DeletedProductSnapshot) => {
    setLastDeletedProduct(snapshot);
    saveDeletedProductSnapshot(snapshot);
  };

  const clearDeletedCategory = () => {
    setLastDeletedCategory(null);
    saveDeletedCategorySnapshot(null);
  };

  const clearDeletedProduct = () => {
    setLastDeletedProduct(null);
    saveDeletedProductSnapshot(null);
  };

  const refreshFeedback = async (productId = selectedProductId) => {
    if (!productId) return;

    const [ratingsResponse, commentsResponse] = await Promise.all([
      api.getProductRatings(productId),
      api.getProductComments(productId),
    ]);

    setRatingSummary(ratingsResponse.data as RatingSummary);
    setPublicComments(commentsResponse.data as CommentItem[]);
  };

  const refreshPendingComments = async () => {
    if (!productManager?.token) return;
    const managerComments = await api.getManagerComments(productManager.token, 'pending');
    setPendingComments(managerComments.data as CommentItem[]);
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

    if (productManager?.token) {
      tasks.push(
        api.getManagerOrders(productManager.token).then((response) => {
          setManagerOrders(response.data as Order[]);
        }),
      );
      tasks.push(
        api.getDeliveries(productManager.token).then((response) => {
          setDeliveries(response.data as Delivery[]);
        }),
      );
    } else {
      setDeliveries([]);
    }

    await Promise.all(tasks);
  };

  const refreshRefundRequests = async () => {
    if (!salesManager?.token) return;
    const response = await api.getManagerRefundRequests(salesManager.token);
    setRefundRequests(response.data as RefundRequest[]);
  };

  const decideRefundRequest = async (
    refund: RefundRequest,
    status: 'approved' | 'rejected' | 'completed',
  ) => {
    if (!salesManager?.token) throw new Error('Sales manager login is required.');
    await api.updateManagerRefundRequest(salesManager.token, refund.id, status);
    addLog(`Refund ${refund.id.slice(-6)} marked as ${status}.`, 'ok');
    await Promise.all([
      refreshRefundRequests(),
      refreshOrders().catch(() => undefined),
      loadProducts().catch(() => undefined),
    ]);
  };

  const loadInvoiceReport = async () => {
    if (!salesManager?.token) throw new Error('Sales manager login is required.');

    const params = { startDate: reportStartDate, endDate: reportEndDate };
    const invoicesRes = await api.getManagerInvoices(salesManager.token, params);

    setReportInvoices(invoicesRes.data as ManagerInvoice[]);
    setInvoicesLoaded(true);
    addLog(
      `${(invoicesRes.data as ManagerInvoice[]).length} invoices loaded for the selected range.`,
      'ok',
    );
  };

  const loadChartReports = async () => {
    if (!salesManager?.token) throw new Error('Sales manager login is required.');

    const params = { startDate: chartStartDate, endDate: chartEndDate };
    const [revenueRes, profitRes] = await Promise.all([
      api.getManagerRevenue(salesManager.token, { ...params, groupBy: 'day' }),
      api.getManagerProfitLoss(salesManager.token, { ...params, groupBy: 'day' }),
    ]);

    setRevenueReport(revenueRes.data as RevenueReport);
    setProfitReport(profitRes.data as ProfitLossReport);
    setChartsLoaded(true);
    addLog('Revenue and profit/loss charts loaded.', 'ok');
  };

  const printManagerInvoice = async (invoice: ManagerInvoice) => {
    if (!salesManager?.token) throw new Error('Sales manager login is required.');
    const blob = await api.downloadManagerInvoicePdf(salesManager.token, invoice.orderId);
    const url = URL.createObjectURL(blob);
    const frame = document.createElement('iframe');
    frame.style.display = 'none';
    frame.src = url;
    document.body.appendChild(frame);
    frame.onload = () => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } finally {
        // Keep the frame alive long enough for the print dialog, then clean up.
        setTimeout(() => {
          frame.remove();
          URL.revokeObjectURL(url);
        }, 60_000);
      }
    };
    addLog(`Invoice ${invoice.invoiceNumber} sent to the printer.`, 'ok');
  };

  const downloadManagerInvoice = async (invoice: ManagerInvoice) => {
    if (!salesManager?.token) throw new Error('Sales manager login is required.');
    const blob = await api.downloadManagerInvoicePdf(salesManager.token, invoice.orderId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber || invoice.orderId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addLog(`Invoice ${invoice.invoiceNumber} downloaded as PDF.`, 'ok');
  };

  const loginAs = async (kind: 'customer' | 'salesManager' | 'productManager') => {
    const credentials =
      kind === 'customer'
        ? customerCredentials
        : kind === 'salesManager'
          ? salesManagerCredentials
          : productManagerCredentials;

    try {
      const response = await api.login(credentials);
      const data = response.data as { token: string; user: LoginUser };
      const loginState = { token: data.token, user: data.user };

      if (kind === 'customer') {
        setCustomer(loginState);
      } else if (kind === 'salesManager') {
        setSalesManager(loginState);
        setProductManager(null);          // only one manager role active at a time
      } else {
        setProductManager(loginState);
        setSalesManager(null);            // only one manager role active at a time
      }

      addLog(`${data.user.name} logged in.`, 'ok');
    } catch {
      if (kind !== 'customer') {
        throw new Error('Manager seed users are missing. Run the seed script first.');
      }

      await ensureAccounts();
      const response = await api.login(customerCredentials);
      const data = response.data as { token: string; user: LoginUser };
      const loginState = { token: data.token, user: data.user };
      setCustomer(loginState);
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
    addLog('Comment sent to product manager approval.', 'ok');
    setCommentText('');
    await Promise.all([refreshFeedback(selectedProduct.id), loadProducts()]);
  };

  const reviewComment = async (
    commentId: string,
    approvalStatus: 'approved' | 'rejected',
  ) => {
    if (!productManager) throw new Error('Product manager login is required.');

    await api.reviewComment(productManager.token, commentId, approvalStatus);
    addLog(`Comment ${approvalStatus}.`, approvalStatus === 'approved' ? 'ok' : 'info');
    await Promise.all([refreshFeedback(), refreshPendingComments()]);
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
    if (!productManager) throw new Error('Product manager login is required.');
    const nextStatus = nextOrderStatus(order.status);
    if (!nextStatus) throw new Error('Order is already delivered.');

    await api.updateManagerOrderStatus(productManager.token, order.id, nextStatus);
    addLog(`Order moved to ${nextStatus}.`, 'ok');
    await refreshOrders();
  };

  const updateDeliveryStatus = async (delivery: Delivery) => {
    if (!productManager) throw new Error('Product manager login is required.');
    const nextStatus = nextDeliveryStatus(delivery.status);
    if (!nextStatus) throw new Error('Delivery is already completed.');

    await api.updateDeliveryStatus(productManager.token, delivery.deliveryId, nextStatus);
    addLog(`Delivery ${delivery.deliveryId} moved to ${nextStatus}.`, 'ok');
    await refreshOrders();
  };

  const enterBulkApprove = () => {
    setSelectedPendingIds(new Set(pendingComments.map((comment) => comment.id)));
    setBulkApproveMode(true);
  };

  const exitBulkApprove = () => {
    setBulkApproveMode(false);
    setSelectedPendingIds(new Set());
  };

  const togglePendingSelection = (id: string) => {
    setSelectedPendingIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmBulkApprove = async () => {
    if (!productManager) throw new Error('Product manager login is required.');
    const ids = [...selectedPendingIds];
    if (!ids.length) throw new Error('Select at least one comment.');

    for (const id of ids) {
      await api.reviewComment(productManager.token, id, 'approved');
    }
    addLog(`Approved ${ids.length} comment${ids.length > 1 ? 's' : ''}.`, 'ok');
    exitBulkApprove();
    await Promise.all([refreshPendingComments(), selectedProductId ? refreshFeedback() : Promise.resolve()]);
  };

  const enterBulkAdvance = () => {
    const advanceable = managerOrders
      .filter((order) => nextOrderStatus(order.status))
      .map((order) => order.id);
    setSelectedOrderIds(new Set(advanceable));
    setBulkAdvanceMode(true);
  };

  const exitBulkAdvance = () => {
    setBulkAdvanceMode(false);
    setSelectedOrderIds(new Set());
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmBulkAdvance = async () => {
    if (!productManager) throw new Error('Product manager login is required.');
    const targets = managerOrders.filter(
      (order) => selectedOrderIds.has(order.id) && nextOrderStatus(order.status),
    );
    if (!targets.length) throw new Error('Select at least one advanceable order.');

    for (const order of targets) {
      const nextStatus = nextOrderStatus(order.status);
      if (!nextStatus) continue;
      await api.updateManagerOrderStatus(productManager.token, order.id, nextStatus);
    }
    addLog(`Advanced ${targets.length} order${targets.length > 1 ? 's' : ''}.`, 'ok');
    exitBulkAdvance();
    await refreshOrders();
  };

  const updatePricing = async () => {
    if (!salesManager || !selectedProduct) {
      throw new Error('Sales manager login and product are required.');
    }
    const price = Number(priceInput);
    const discountRate = Number(discountInput);

    if (Number.isNaN(price) || price < 0) throw new Error('Price is invalid.');
    if (Number.isNaN(discountRate) || discountRate < 0 || discountRate > 100) {
      throw new Error('Discount must be between 0 and 100.');
    }

    await api.updateProductPricing(salesManager.token, selectedProduct.id, {
      price,
      discountRate,
      discountActive,
    });
    addLog('Product pricing updated.', 'ok');
    await loadProducts();
  };

  const updateStock = async () => {
    if (!productManager || !selectedProduct) {
      throw new Error('Product manager login and product are required.');
    }

    const stock = Number(stockInput.trim());
    if (Number.isNaN(stock) || stock < 0) {
      throw new Error('Stock must be zero or greater.');
    }

    const response = await api.updateProductStock(
      productManager.token,
      selectedProduct.id,
      { stock },
    );
    const updatedStock = (response.data as { stock?: number })?.stock;
    addLog(
      updatedStock !== undefined
        ? `Stock updated to ${updatedStock} for ${selectedProduct.name}.`
        : `Stock updated for ${selectedProduct.name}.`,
      'ok',
    );
    await refreshCatalog();
  };

  const createCategory = async () => {
    if (!productManager) throw new Error('Product manager login is required.');
    const name = newCategoryName.trim();
    if (!name) throw new Error('Category name is required.');

    const response = await api.createCategory(productManager.token, {
      name,
      description: newCategoryDescription.trim() || `Category for ${name}`,
      slug: `${slugify(name)}-${Date.now()}`,
      isActive: true,
    });
    const created = response.data as CategoryItem;
    addLog(`Category "${created.name}" created.`, 'ok');
    setNewProductCategoryId(created.id);
    await refreshCatalog();
  };

  const createProduct = async () => {
    if (!productManager) throw new Error('Product manager login is required.');
    if (!newProductCategoryId) throw new Error('Select a category first.');

    const name = newProductName.trim();
    const stock = Number(newProductStock);
    if (!name) throw new Error('Product name is required.');
    if (Number.isNaN(stock) || stock < 0) throw new Error('Stock is invalid.');

    const stamp = Date.now();
    const response = await api.createProduct(productManager.token, {
      name,
      description: newProductDescription.trim() || `Demo product ${name}`,
      categoryIds: [newProductCategoryId],
      stock,
      serialNumber: `DEMO-${stamp}`,
      model: `DEMO-MODEL-${stamp}`,
      distributor: 'AURA Demo Warehouse',
      popularity: 50,
      imageUrl: newProductImageUrl.trim() ||
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    });
    const created = response.data as { id: string; name: string };
    addLog(`Product "${created.name}" created under the selected category.`, 'ok');
    setSelectedProductId(created.id);
    await refreshCatalog();
  };

  const deleteCategory = async (category: CategoryItem) => {
    if (!productManager) throw new Error('Product manager login is required.');
    if (
      !window.confirm(
        `Remove category "${category.name}"? You can restore it from the recovery panel below.`,
      )
    ) {
      return;
    }

    const response = await api.deleteCategory(productManager.token, category.id);
    const result = response.data as { unlinkedProducts?: number };

    rememberDeletedCategory({
      name: category.name,
      description: category.description || `Category for ${category.name}`,
      slug: category.slug,
      isActive: category.isActive ?? true,
    });

    if (newProductCategoryId === category.id) {
      setNewProductCategoryId('');
    }

    addLog(
      result.unlinkedProducts
        ? `Category "${category.name}" removed. ${result.unlinkedProducts} linked product(s) were kept in the catalog without this category.`
        : `Category "${category.name}" removed.`,
      'ok',
    );
    await refreshCatalog();
  };

  const deleteSelectedProduct = async () => {
    if (!productManager || !productToRemove) {
      throw new Error('Choose a product to remove from the Remove Product dropdown.');
    }
    if (
      !window.confirm(
        `Remove "${productToRemove.name}" from the catalog? You can restore it from the recovery panel below.`,
      )
    ) {
      return;
    }

    const fullProductResponse = await api.getProduct(productToRemove.id);
    const fullProduct = fullProductResponse.data as {
      name: string;
      description?: string;
      categoryIds?: string[];
      categoryId?: string | null;
      price: number;
      stock?: number;
      stockQuantity?: number;
      serialNumber?: string;
      model?: string;
      distributor?: string;
      popularity?: number;
      discountRate?: number;
      discountActive?: boolean;
      imageUrl?: string;
      warrantyStatus?: boolean;
    };

    const categoryIds =
      fullProduct.categoryIds?.length
        ? fullProduct.categoryIds
        : fullProduct.categoryId
          ? [fullProduct.categoryId]
          : newProductCategoryId
            ? [newProductCategoryId]
            : [];

    rememberDeletedProduct({
      name: fullProduct.name,
      description: fullProduct.description || '',
      categoryIds,
      price: fullProduct.price,
      stock: fullProduct.stock ?? fullProduct.stockQuantity ?? 0,
      serialNumber: fullProduct.serialNumber,
      model: fullProduct.model,
      distributor: fullProduct.distributor,
      popularity: fullProduct.popularity,
      discountRate: fullProduct.discountRate,
      discountActive: fullProduct.discountActive,
      imageUrl: fullProduct.imageUrl,
      warrantyStatus: fullProduct.warrantyStatus,
    });

    await api.deleteProduct(productManager.token, productToRemove.id);
    addLog(`Product "${productToRemove.name}" removed.`, 'ok');
    if (selectedProductId === productToRemove.id) {
      setSelectedProductId('');
    }
    setProductToRemoveId('');
    await refreshCatalog();
  };

  const restoreLastDeletedCategory = async () => {
    if (!productManager || !lastDeletedCategory) {
      throw new Error('No removed category is available to restore.');
    }

    const response = await api.createCategory(productManager.token, {
      name: lastDeletedCategory.name,
      description: lastDeletedCategory.description,
      slug: lastDeletedCategory.slug
        ? `${lastDeletedCategory.slug}-restored-${Date.now()}`
        : `${slugify(lastDeletedCategory.name)}-restored-${Date.now()}`,
      isActive: lastDeletedCategory.isActive ?? true,
    });
    const restored = response.data as CategoryItem;
    clearDeletedCategory();
    setNewProductCategoryId(restored.id);
    addLog(`Category "${restored.name}" restored.`, 'ok');
    await refreshCatalog();
  };

  const restoreLastDeletedProduct = async () => {
    if (!productManager || !lastDeletedProduct) {
      throw new Error('No removed product is available to restore.');
    }
    if (!lastDeletedProduct.categoryIds.length) {
      throw new Error('Restore the product category first, then try again.');
    }

    const stamp = Date.now();
    const response = await api.createProduct(productManager.token, {
      name: lastDeletedProduct.name,
      description: lastDeletedProduct.description,
      categoryIds: lastDeletedProduct.categoryIds,
      price: lastDeletedProduct.price,
      stock: lastDeletedProduct.stock,
      serialNumber: lastDeletedProduct.serialNumber || `RESTORED-${stamp}`,
      model: lastDeletedProduct.model || `RESTORED-MODEL-${stamp}`,
      distributor: lastDeletedProduct.distributor || 'AURA Demo Warehouse',
      popularity: lastDeletedProduct.popularity ?? 50,
      discountRate: lastDeletedProduct.discountRate ?? 0,
      discountActive: lastDeletedProduct.discountActive ?? false,
      imageUrl:
        lastDeletedProduct.imageUrl ||
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
      warrantyStatus: lastDeletedProduct.warrantyStatus ?? false,
    });
    const restored = response.data as { id: string; name: string };
    clearDeletedProduct();
    setSelectedProductId(restored.id);
    addLog(`Product "${restored.name}" restored.`, 'ok');
    await refreshCatalog();
  };

  useEffect(() => {
    run('load-products', async () => {
      await refreshCatalog();
      addLog('Products loaded.', 'ok');
    });
  }, []);

  useEffect(() => {
    if (selectedProductId) {
      refreshFeedback(selectedProductId).catch((error) => {
        addLog(error instanceof Error ? error.message : 'Feedback refresh failed.', 'error');
      });
    }
  }, [selectedProductId, productManager?.token]);

  useEffect(() => {
    if (!selectedProduct) return;
    setPriceInput(String(selectedProduct.price));
    setDiscountInput(String(selectedProduct.discountRate));
    setDiscountActive(selectedProduct.discountActive);
    setStockInput(String(selectedProduct.stockQuantity ?? 0));
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProductId && products.some((product) => product.id === selectedProductId)) {
      setProductToRemoveId(selectedProductId);
    }
  }, [selectedProductId, products]);

  useEffect(() => {
    if (productToRemoveId && products.some((product) => product.id === productToRemoveId)) {
      return;
    }
    setProductToRemoveId(products[0]?.id ?? '');
  }, [products, productToRemoveId]);

  useEffect(() => {
    refreshOrders().catch(() => undefined);
  }, [customer?.token, productManager?.token]);

  useEffect(() => {
    if (!salesManager?.token) return;
    refreshRefundRequests().catch((error) => {
      addLog(
        error instanceof Error
          ? `Refund queue refresh failed: ${error.message}`
          : 'Refund queue refresh failed.',
        'error',
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salesManager?.token]);

  // Auto-load the global pending-comments queue as soon as the product manager
  // session is available. Without this the Approval section stays empty
  // until the product manager picks a product (since `refreshFeedback` was the only
  // path that fetched pending comments before).
  useEffect(() => {
    if (!productManager?.token) return;
    refreshCatalog().catch(() => undefined);
    refreshPendingComments().catch((error) => {
      addLog(
        error instanceof Error
          ? `Pending queue refresh failed: ${error.message}`
          : 'Pending queue refresh failed.',
        'error',
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productManager?.token]);

  return (
    <div className="bg-[#f7f4ef]">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-800">
              <ShieldCheck size={14} />
              Operations Console
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-stone-950 sm:text-4xl">
              AURA Operations Console
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-stone-600">
              End-to-end operations console for managers — drive customer purchases,
              moderate comments, walk orders through delivery, and tune
              pricing/discounts without leaving the page.
            </p>
            <div className="mt-5 grid max-w-3xl grid-cols-1 gap-3 text-sm sm:grid-cols-4">
              <div className="rounded-lg border border-stone-200 bg-[#fffaf2] p-4">
                <div className="font-bold text-stone-900">Customer</div>
                <div className="mt-1 text-stone-600">customer@aura.test</div>
              </div>
              <div className="rounded-lg border border-stone-200 bg-[#f2fbf8] p-4">
                <div className="font-bold text-stone-900">Sales Manager</div>
                <div className="mt-1 text-stone-600">sales.manager@aura.test</div>
              </div>
              <div className="rounded-lg border border-stone-200 bg-[#eef6ff] p-4">
                <div className="font-bold text-stone-900">Product Manager</div>
                <div className="mt-1 text-stone-600">manager@aura.test</div>
              </div>
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-[#f4f7ff] px-4 py-2.5 text-sm font-bold text-stone-900 hover:border-indigo-300"
              >
                Open Mailpit (invoice mailbox)
                <ExternalLink size={15} />
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

            <div className="grid gap-3 sm:grid-cols-3">
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
                onClick={() => run('login-sales-manager', () => loginAs('salesManager'))}
                disabled={Boolean(busyAction)}
                className="rounded-md bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                Login Sales
              </button>
              <button
                type="button"
                onClick={() => run('login-product-manager', () => loginAs('productManager'))}
                disabled={Boolean(busyAction)}
                className="rounded-md bg-indigo-700 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
              >
                Login Product
              </button>
            </div>

            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
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
                  Sales Manager
                </div>
                <div className="mt-1 font-semibold text-stone-900">
                  {salesManager?.user.name ?? 'Not logged in'}
                </div>
              </div>
              <div className="rounded-lg border border-stone-200 p-3">
                <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                  Product Manager
                </div>
                <div className="mt-1 font-semibold text-stone-900">
                  {productManager?.user.name ?? 'Not logged in'}
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
                <div className="mt-1 flex flex-wrap items-center gap-2 text-stone-500">
                  <span>
                    Stock {selectedProduct?.stockQuantity ?? 0} / Rating{' '}
                    {ratingSummary.ratingAverage || selectedProduct?.rating || 0}
                  </span>
                  {selectedProduct?.stockQuantity === 0 ? (
                    <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                      Out of stock
                    </span>
                  ) : null}
                  {selectedProduct &&
                  selectedProduct.stockQuantity > 0 &&
                  selectedProduct.stockQuantity <= 5 ? (
                    <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                      Low stock
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-indigo-200 bg-[#f7f8ff] p-4">
              <div className="mb-3 flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-indigo-700" />
                <h3 className="text-sm font-extrabold text-stone-950">Stock Management</h3>
              </div>

              {!productManager ? (
                <p className="text-sm text-stone-600">
                  Login as product manager (`manager@aura.test`) to update stock levels.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-stone-500">
                      Set stock
                    </span>
                    <input
                      value={stockInput}
                      onChange={(event) => setStockInput(event.target.value)}
                      className="h-11 w-full rounded-md border border-stone-300 px-3 text-sm font-semibold"
                      inputMode="numeric"
                      min="0"
                      placeholder="e.g. 0 or 1"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => run('update-stock', updateStock)}
                    disabled={Boolean(busyAction)}
                    className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-extrabold text-white hover:bg-indigo-800 disabled:opacity-50"
                  >
                    <PackageCheck size={16} />
                    Update Stock
                  </button>
                </div>
              )}
            </div>

            {productManager && lowStockProducts.length > 0 ? (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-800">
                  Low / out of stock
                </div>
                <ul className="space-y-2 text-sm text-amber-900">
                  {lowStockProducts.map((product) => (
                    <li key={product.id} className="flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProductId(product.id)}
                        className="truncate text-left font-semibold hover:underline"
                      >
                        {product.name}
                      </button>
                      <span className="shrink-0 font-bold">
                        {product.stockQuantity === 0 ? 'Out of stock' : `${product.stockQuantity} left`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-indigo-700" />
              <div>
                <h2 className="text-xl font-extrabold text-stone-950">Catalog Management</h2>
                <p className="text-sm text-stone-500">
                  Categories, new products, and removals for the product manager demo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => run('refresh-catalog', refreshCatalog)}
              disabled={Boolean(busyAction)}
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {!productManager ? (
            <p className="text-sm text-stone-600">
              Login as product manager (`manager@aura.test`) to manage categories and products.
            </p>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-lg border border-stone-200 p-4">
                <h3 className="text-sm font-extrabold text-stone-950">Categories</h3>
                <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto text-sm text-stone-700">
                  {categories.map((category) => (
                    <li
                      key={category.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-stone-200 bg-stone-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-stone-900">{category.name}</div>
                        {category.description ? (
                          <div className="mt-1 text-xs text-stone-500">{category.description}</div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => run(`delete-category-${category.id}`, () => deleteCategory(category))}
                        disabled={Boolean(busyAction)}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                        title={`Remove ${category.name}`}
                      >
                        <Trash2 size={12} />
                        Remove
                      </button>
                    </li>
                  ))}
                  {!categories.length ? (
                    <li className="text-stone-500">No categories loaded yet.</li>
                  ) : null}
                </ul>

                <div className="mt-4 grid gap-3">
                  <input
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    className="h-11 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                    placeholder="New category name"
                  />
                  <textarea
                    value={newCategoryDescription}
                    onChange={(event) => setNewCategoryDescription(event.target.value)}
                    rows={2}
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                    placeholder="Category description"
                  />
                  <button
                    type="button"
                    onClick={() => run('create-category', createCategory)}
                    disabled={Boolean(busyAction)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-indigo-700 px-4 text-sm font-extrabold text-white hover:bg-indigo-800 disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Add Category
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-stone-200 p-4">
                <h3 className="text-sm font-extrabold text-stone-950">Add Product</h3>
                <div className="mt-4 grid gap-3">
                  <input
                    value={newProductName}
                    onChange={(event) => setNewProductName(event.target.value)}
                    className="h-11 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                    placeholder="Product name"
                  />
                  <textarea
                    value={newProductDescription}
                    onChange={(event) => setNewProductDescription(event.target.value)}
                    rows={2}
                    className="rounded-md border border-stone-300 px-3 py-2 text-sm"
                    placeholder="Product description"
                  />
                  <select
                    value={newProductCategoryId}
                    onChange={(event) => setNewProductCategoryId(event.target.value)}
                    className="h-11 rounded-md border border-stone-300 bg-white px-3 text-sm font-semibold"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newProductStock}
                    onChange={(event) => setNewProductStock(event.target.value)}
                    className="h-11 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                    inputMode="numeric"
                    placeholder="Stock"
                  />

                  {/* Image URL field + live preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-md border border-stone-300 px-3 h-11">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-stone-400"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      <input
                        value={newProductImageUrl}
                        onChange={(event) => setNewProductImageUrl(event.target.value)}
                        className="flex-1 border-0 bg-transparent p-0 text-sm outline-none"
                        placeholder="Image URL (leave blank for default)"
                        type="url"
                      />
                    </div>
                    {newProductImageUrl.trim() && (
                      <div className="relative overflow-hidden rounded-md border border-stone-200 bg-stone-100" style={{height: 120}}>
                        <img
                          src={newProductImageUrl.trim()}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <span className="absolute bottom-1 right-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-bold text-white">Preview</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => run('create-product', createProduct)}
                    disabled={Boolean(busyAction)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-extrabold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    <Plus size={16} />
                    Add Product
                  </button>
                  <p className="text-xs text-stone-500">
                    Fiyat alanı yok — sales manager Pricing panelinden atar.
                    Fotoğraf URL'si boş bırakılırsa varsayılan görüntü kullanılır.
                  </p>
                </div>

                <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50/50 p-4">
                  <h3 className="text-sm font-extrabold text-rose-950">Remove Product</h3>
                  <p className="mt-1 text-xs text-rose-800">
                    Choose the catalog item to delete here. This is separate from the Add Product
                    form above.
                  </p>
                  <select
                    value={productToRemoveId}
                    onChange={(event) => setProductToRemoveId(event.target.value)}
                    className="mt-3 h-11 w-full rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-stone-900"
                  >
                    <option value="">Select product to remove</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                        {product.stockQuantity === 0 ? ' — out of stock' : ` — stock ${product.stockQuantity}`}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => run('delete-product', deleteSelectedProduct)}
                    disabled={Boolean(busyAction) || !productToRemove}
                    className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-rose-300 bg-white px-4 text-sm font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  >
                    <Trash2 size={16} />
                    Remove Selected Product
                  </button>
                </div>
              </div>

              {(lastDeletedCategory || lastDeletedProduct) && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 xl:col-span-2">
                  <div className="mb-3 flex items-center gap-2">
                    <Undo2 className="h-5 w-5 text-amber-800" />
                    <h3 className="text-sm font-extrabold text-amber-950">Recovery</h3>
                  </div>
                  <p className="mb-4 text-sm text-amber-900">
                    Accidentally removed something? Bring the latest deleted category or product
                    back into the catalog.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {lastDeletedCategory ? (
                      <button
                        type="button"
                        onClick={() => run('restore-category', restoreLastDeletedCategory)}
                        disabled={Boolean(busyAction)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-amber-300 bg-white px-4 text-sm font-extrabold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                      >
                        <Undo2 size={16} />
                        Restore category &quot;{lastDeletedCategory.name}&quot;
                      </button>
                    ) : null}
                    {lastDeletedProduct ? (
                      <button
                        type="button"
                        onClick={() => run('restore-product', restoreLastDeletedProduct)}
                        disabled={Boolean(busyAction)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-amber-300 bg-white px-4 text-sm font-extrabold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                      >
                        <Undo2 size={16} />
                        Restore product &quot;{lastDeletedProduct.name}&quot;
                      </button>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

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

            {bulkApproveMode ? (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => run('bulk-approve', confirmBulkApprove)}
                  disabled={Boolean(busyAction) || !selectedPendingIds.size}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckSquare size={16} />
                  Approve Selected ({selectedPendingIds.size})
                </button>
                <button
                  type="button"
                  onClick={exitBulkApprove}
                  disabled={Boolean(busyAction)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                >
                  <X size={16} />
                  Cancel
                </button>
              </div>
            ) : (
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => run('refresh-pending', refreshPendingComments)}
                  disabled={Boolean(busyAction)}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-2.5 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                >
                  <RefreshCw size={16} />
                  Refresh Queue
                </button>
                <button
                  type="button"
                  onClick={enterBulkApprove}
                  disabled={Boolean(busyAction) || !pendingComments.length}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50"
                >
                  <ListChecks size={16} />
                  Approve All
                </button>
              </div>
            )}

            <div className="space-y-3">
              {pendingComments.map((comment) => {
                const isSelected = selectedPendingIds.has(comment.id);
                return (
                  <div
                    key={comment.id}
                    className={`rounded-lg border p-3 ${
                      bulkApproveMode && isSelected
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-stone-200'
                    }`}
                  >
                    <div className="mb-2 flex items-start gap-3">
                      {bulkApproveMode ? (
                        <button
                          type="button"
                          onClick={() => togglePendingSelection(comment.id)}
                          className="mt-0.5 text-stone-700 hover:text-stone-950"
                          aria-label={isSelected ? 'Deselect' : 'Select'}
                        >
                          {isSelected ? <CheckSquare size={20} className="text-emerald-700" /> : <Square size={20} />}
                        </button>
                      ) : null}
                      <div className="flex flex-1 items-center justify-between">
                        <span className="font-bold text-stone-900">{comment.customerName}</span>
                        <span className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(comment.approvalStatus)}`}>
                          {comment.approvalStatus}
                        </span>
                      </div>
                    </div>
                    <p className="mb-3 text-sm leading-6 text-stone-600">{comment.content}</p>
                    {!bulkApproveMode ? (
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
                    ) : null}
                  </div>
                );
              })}
              {!pendingComments.length ? (
                <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                  No pending comments.
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <section className="mt-6 max-w-xl rounded-lg border border-stone-200 bg-white p-5">
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

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-sky-700" />
              <div>
                <h2 className="text-xl font-extrabold text-stone-950">Deliveries</h2>
                <p className="text-sm text-stone-500">
                  Delivery list with ID, customer, product, quantity, price, address, and status.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => run('refresh-deliveries', refreshOrders)}
              disabled={Boolean(busyAction) || !productManager?.token}
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {!productManager?.token ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Sign in as the product manager to load the delivery list.
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => {
                const nextStatus = nextDeliveryStatus(delivery.status);
                return (
                  <div key={delivery.deliveryId} className="rounded-lg border border-stone-200 p-4">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-stone-900">{delivery.productName}</div>
                        <div className="text-sm text-stone-500">
                          {delivery.quantity} item{delivery.quantity === 1 ? '' : 's'} · {money(delivery.totalPrice)}
                        </div>
                      </div>
                      <span
                        className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(delivery.status)}`}
                      >
                        {delivery.status}
                      </span>
                    </div>

                    <dl className="grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="font-bold text-stone-700">Delivery ID</dt>
                        <dd className="break-all font-mono text-xs text-stone-600">{delivery.deliveryId}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-stone-700">Customer ID</dt>
                        <dd className="break-all font-mono text-xs text-stone-600">{delivery.customerId}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-stone-700">Product ID</dt>
                        <dd className="break-all font-mono text-xs text-stone-600">{delivery.productId}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-stone-700">Quantity</dt>
                        <dd className="text-stone-600">{delivery.quantity}</dd>
                      </div>
                      <div>
                        <dt className="font-bold text-stone-700">Total Price</dt>
                        <dd className="text-stone-600">{money(delivery.totalPrice)}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="font-bold text-stone-700">Delivery Address</dt>
                        <dd className="text-stone-600">{delivery.deliveryAddress}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      onClick={() => run('update-delivery', () => updateDeliveryStatus(delivery))}
                      disabled={!nextStatus}
                      className="mt-3 rounded-md bg-sky-700 px-3 py-2 text-sm font-bold text-white hover:bg-sky-800 disabled:bg-stone-200 disabled:text-stone-500"
                    >
                      {nextStatus ? `Move to ${nextStatus}` : 'Delivered'}
                    </button>
                  </div>
                );
              })}
              {!deliveries.length ? (
                <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                  No deliveries loaded yet. Complete a customer checkout first, then refresh.
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-700" />
              <h2 className="text-xl font-extrabold text-stone-950">Refund Requests</h2>
            </div>
            <button
              type="button"
              onClick={() => run('refresh-refunds', refreshRefundRequests)}
              disabled={Boolean(busyAction) || !salesManager?.token}
              className="inline-flex items-center gap-2 rounded-md border border-stone-300 px-3 py-2 text-sm font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {!salesManager?.token ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Sign in as the sales manager to review refund requests.
            </div>
          ) : (
            <div className="space-y-3">
              {refundRequests.map((refund) => (
                <div key={refund.id} className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-stone-900">
                        {refund.quantity} x {refund.productName}
                      </div>
                      <div className="text-sm text-stone-500">
                        Order {refund.orderId.slice(-8)} - refund {money(refund.refundedAmount)}
                      </div>
                      {refund.reason ? (
                        <div className="mt-1 text-sm italic text-stone-500">"{refund.reason}"</div>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-md border px-2 py-1 text-xs font-bold ${statusClass(refund.status)}`}
                      data-testid={`refund-status-${refund.id}`}
                    >
                      {refund.status}
                    </span>
                  </div>
                  {refund.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => run('refund-approve', () => decideRefundRequest(refund, 'approved'))}
                        disabled={Boolean(busyAction)}
                        className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => run('refund-reject', () => decideRefundRequest(refund, 'rejected'))}
                        disabled={Boolean(busyAction)}
                        className="rounded-md bg-rose-700 px-3 py-2 text-sm font-bold text-white hover:bg-rose-800 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : null}
                  {refund.status === 'approved' ? (
                    <button
                      type="button"
                      onClick={() => run('refund-complete', () => decideRefundRequest(refund, 'completed'))}
                      disabled={Boolean(busyAction)}
                      className="rounded-md bg-indigo-700 px-3 py-2 text-sm font-bold text-white hover:bg-indigo-800 disabled:opacity-50"
                    >
                      Product received - complete refund
                    </button>
                  ) : null}
                </div>
              ))}
              {!refundRequests.length ? (
                <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                  No refund requests yet.
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-700" />
              <h2 className="text-xl font-extrabold text-stone-950">Invoices</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={reportStartDate}
                onChange={(event) => setReportStartDate(event.target.value)}
                className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                data-testid="report-start-date"
              />
              <span className="text-sm font-bold text-stone-500">→</span>
              <input
                type="date"
                value={reportEndDate}
                onChange={(event) => setReportEndDate(event.target.value)}
                className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                data-testid="report-end-date"
              />
              <button
                type="button"
                onClick={() => run('load-invoices', loadInvoiceReport)}
                disabled={Boolean(busyAction) || !salesManager?.token}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                data-testid="load-invoices"
              >
                <RefreshCw size={15} />
                Load invoices
              </button>
            </div>
          </div>

          {!salesManager?.token ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Sign in as the sales manager to list invoices in a date range.
            </div>
          ) : !invoicesLoaded ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Pick a date range and press “Load invoices”.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="text-sm font-bold text-stone-600" data-testid="report-invoice-count">
                {reportInvoices.length} invoice{reportInvoices.length === 1 ? '' : 's'} between{' '}
                {reportStartDate} and {reportEndDate}
              </div>
              <div className="space-y-2" data-testid="report-invoice-list">
                {reportInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 p-3"
                  >
                    <div>
                      <div className="font-bold text-stone-900">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-stone-500">
                        {invoice.customerEmail ?? invoice.orderId}
                        {invoice.createdAt
                          ? ` — ${new Date(invoice.createdAt).toLocaleDateString()}`
                          : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-stone-900">{money(invoice.totalAmount)}</span>
                      <button
                        type="button"
                        onClick={() => run('download-invoice', () => downloadManagerInvoice(invoice))}
                        disabled={Boolean(busyAction)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                      >
                        <FileText size={13} />
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => run('print-invoice', () => printManagerInvoice(invoice))}
                        disabled={Boolean(busyAction)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 px-3 py-1.5 text-xs font-bold text-stone-800 hover:bg-stone-50 disabled:opacity-50"
                        data-testid={`print-invoice-${invoice.id}`}
                      >
                        <Printer size={13} />
                        Print
                      </button>
                    </div>
                  </div>
                ))}
                {!reportInvoices.length ? (
                  <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                    No invoices in the selected date range.
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-700" />
              <h2 className="text-xl font-extrabold text-stone-950">Revenue &amp; Profit / Loss</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={chartStartDate}
                onChange={(event) => setChartStartDate(event.target.value)}
                className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                data-testid="chart-start-date"
              />
              <span className="text-sm font-bold text-stone-500">→</span>
              <input
                type="date"
                value={chartEndDate}
                onChange={(event) => setChartEndDate(event.target.value)}
                className="h-10 rounded-md border border-stone-300 px-3 text-sm font-semibold"
                data-testid="chart-end-date"
              />
              <button
                type="button"
                onClick={() => run('load-charts', loadChartReports)}
                disabled={Boolean(busyAction) || !salesManager?.token}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                data-testid="load-charts"
              >
                <RefreshCw size={15} />
                Load charts
              </button>
            </div>
          </div>

          {!salesManager?.token ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Sign in as the sales manager to view the revenue and profit/loss charts.
            </div>
          ) : !chartsLoaded ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Pick a date range and press “Load charts”.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Invoices</div>
                  <div className="text-2xl font-extrabold text-stone-950" data-testid="chart-invoice-count">
                    {revenueReport?.invoiceCount ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Revenue</div>
                  <div className="text-2xl font-extrabold text-emerald-700" data-testid="report-revenue">
                    {money(revenueReport?.totalRevenue ?? 0)}
                  </div>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">Cost</div>
                  <div className="text-2xl font-extrabold text-stone-700">
                    {money(profitReport?.totalCost ?? 0)}
                  </div>
                </div>
                <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    {Number(profitReport?.profit ?? 0) >= 0 ? 'Profit' : 'Loss'}
                  </div>
                  <div
                    className={`text-2xl font-extrabold ${
                      Number(profitReport?.profit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                    data-testid="report-profit"
                  >
                    {money(Math.abs(profitReport?.profit ?? 0))}
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-2 text-sm font-extrabold text-stone-800">Revenue &amp; Cost over time</div>
                  <div className="h-64" data-testid="revenue-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      {/* Use profitReport.chart so both revenue and cost are available */}
                      <LineChart data={profitReport?.chart ?? revenueReport?.chart ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <ChartTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#047857" strokeWidth={2} dot />
                        <Line type="monotone" dataKey="cost" name="Cost" stroke="#f59e0b" strokeWidth={2} dot strokeDasharray="5 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="rounded-lg border border-stone-200 p-3">
                  <div className="mb-2 text-sm font-extrabold text-stone-800">Revenue / Cost / Profit</div>
                  <div className="h-64" data-testid="profit-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={profitReport?.chart ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                        <ChartTooltip formatter={(value: number) => [`$${value.toFixed(2)}`, undefined]} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue" fill="#047857" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="profit" name="Profit" fill="#1d4ed8" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="mt-6 rounded-lg border border-stone-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-5 w-5 text-rose-700" />
            <h2 className="text-xl font-extrabold text-stone-950">Manager Pricing</h2>
          </div>

          {!salesManager?.token ? (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              Sign in as the sales manager to set prices and discounts.
            </div>
          ) : (
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
          )}
        </section>

        <EndpointTester />
      </main>
    </div>
  );
}
