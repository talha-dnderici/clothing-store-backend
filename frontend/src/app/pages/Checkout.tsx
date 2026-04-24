import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function formatCardNumber(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4);
  if (digits.length < 3) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
function detectCardBrand(num: string): 'visa' | 'mastercard' | 'amex' | 'unknown' {
  const n = num.replace(/\s/g, '');
  if (/^4/.test(n)) return 'visa';
  if (/^5[1-5]/.test(n)) return 'mastercard';
  if (/^3[47]/.test(n)) return 'amex';
  return 'unknown';
}

/**
 * FE-9 (SCRUM-37) — Mock checkout / payment interface.
 * Pure UI: collects card details, validates basic format, then redirects
 * to /invoice with mock order data in route-state.
 */
export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: user?.name ?? '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
  });

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const updateCardNumber = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, cardNumber: formatCardNumber(e.target.value) }));
  const updateExpiry = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, expiry: formatExpiry(e.target.value) }));

  const validate = (): string | null => {
    if (!form.fullName.trim()) return 'Full name is required';
    if (!form.address.trim()) return 'Address is required';
    if (!/^\d{16}$/.test(form.cardNumber.replace(/\s+/g, '')))
      return 'Card number must be 16 digits';
    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) return 'Expiry must be MM/YY';
    if (!/^\d{3,4}$/.test(form.cvc)) return 'CVC must be 3 or 4 digits';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setProcessing(true);

    try {
      const token = localStorage.getItem('token') || '';
      const orderRes = await api.checkout(token, {
        deliveryAddress: `${form.address}, ${form.city} ${form.postalCode}`.trim(),
      });
      const data = orderRes.data;

      const invoice = {
        orderId: data.id || data._id || `ORD-${Date.now().toString(36).toUpperCase()}`,
        placedAt: data.createdAt || new Date().toISOString(),
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.price * i.quantity,
        })),
        total: totalPrice,
        customer: {
          name: form.fullName,
          email: user?.email ?? 'guest@example.com',
          address: `${form.address}, ${form.city} ${form.postalCode}`.trim(),
        },
        maskedCard: `**** **** **** ${form.cardNumber.slice(-4)}`,
      };

      clearCart();
      navigate('/invoice', { state: { invoice } });
    } catch (err: any) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-gray-500">Your cart is empty.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10" data-testid="checkout-page">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
        <Lock size={22} /> Secure Checkout
      </h1>

      <div className="mb-8 flex items-center gap-3 text-sm">
        <StepDot label="Cart" done />
        <StepLine />
        <StepDot label="Payment" active />
        <StepLine />
        <StepDot label="Confirmation" />
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900">Shipping Address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name" value={form.fullName} onChange={update('fullName')} name="fullName" />
              <Input label="Address" value={form.address} onChange={update('address')} name="address" />
              <Input label="City" value={form.city} onChange={update('city')} name="city" />
              <Input label="Postal code" value={form.postalCode} onChange={update('postalCode')} name="postalCode" />
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <CreditCard size={18} /> Payment Details
            </h2>
            <label className="block text-sm relative">
              <span className="text-gray-600 font-medium">Card number</span>
              <input
                type="text"
                name="cardNumber"
                value={form.cardNumber}
                onChange={updateCardNumber}
                placeholder="1234 1234 1234 1234"
                maxLength={19}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-black pr-16"
              />
              <span className="absolute right-3 top-8 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                {detectCardBrand(form.cardNumber) !== 'unknown' ? detectCardBrand(form.cardNumber) : ''}
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Expiry (MM/YY)"
                value={form.expiry}
                onChange={updateExpiry}
                name="expiry"
                placeholder="04/28"
                maxLength={5}
              />
              <Input
                label="CVC"
                value={form.cvc}
                onChange={update('cvc')}
                name="cvc"
                placeholder="123"
                maxLength={4}
              />
            </div>
            <p className="text-xs text-gray-400">
              * This is a mock payment — no real charges are made.
            </p>
          </section>

          {error && (
            <div
              role="alert"
              data-testid="checkout-error"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200"
            >
              {error}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm h-fit space-y-3">
          <h2 className="font-bold text-gray-900">Order Summary</h2>
          {items.map((i) => (
            <div key={i.id} className="flex justify-between text-sm">
              <span className="text-gray-700 truncate mr-2">
                {i.name} × {i.quantity}
              </span>
              <span className="font-semibold">${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-3 flex justify-between">
            <span className="font-bold">Total</span>
            <span className="font-bold" data-testid="checkout-total">${totalPrice.toFixed(2)}</span>
          </div>
          <button
            type="submit"
            disabled={processing}
            data-testid="pay-btn"
            className="w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {processing ? 'Processing…' : `Pay $${totalPrice.toFixed(2)}`}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 pt-2">
            <ShieldCheck size={14} className="text-green-600" />
            <span>256-bit SSL encrypted</span>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Input(props: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <label className="block text-sm">
      <span className="text-gray-600 font-medium">{props.label}</span>
      <input
        type="text"
        name={props.name}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        maxLength={props.maxLength}
        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
      />
    </label>
  );
}

function StepDot({ label, active, done }: { label: string; active?: boolean; done?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        done ? 'bg-green-600 text-white' : active ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
      }`}>
        {done ? <CheckCircle2 size={14} /> : null}
      </div>
      <span className={`font-semibold ${active ? 'text-black' : done ? 'text-green-700' : 'text-gray-400'}`}>
        {label}
      </span>
    </div>
  );
}

function StepLine() {
  return <div className="flex-1 h-px bg-gray-200" />;
}
