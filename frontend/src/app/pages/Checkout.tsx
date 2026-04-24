import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { CreditCard, Lock } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

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

    // Mock network delay
    await new Promise((r) => setTimeout(r, 700));

    const invoice = {
      orderId: `MOCK-${Date.now().toString(36).toUpperCase()}`,
      placedAt: new Date().toISOString(),
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
            <Input
              label="Card number"
              value={form.cardNumber}
              onChange={update('cardNumber')}
              name="cardNumber"
              placeholder="1234 1234 1234 1234"
              maxLength={19}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Expiry (MM/YY)"
                value={form.expiry}
                onChange={update('expiry')}
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
