import React from 'react';
import { Link, useLocation, Navigate } from 'react-router';
import { CheckCircle2, Printer, Package, Calendar } from 'lucide-react';

/**
 * FE-10 (SCRUM-38) — On-screen invoice summary.
 * Reads the just-placed order from navigation state passed by Checkout.
 */

export interface InvoiceItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface InvoicePayload {
  orderId: string;
  placedAt: string;
  items: InvoiceItem[];
  total: number;
  customer: { name: string; email: string; address: string };
  maskedCard: string;
}

export default function Invoice() {
  const location = useLocation();
  const invoice = (location.state as { invoice?: InvoicePayload } | null)?.invoice;

  if (!invoice) {
    // Direct navigation — no invoice in state. Bounce to home.
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10" data-testid="invoice-page">
      <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
        <div className="text-center pb-6 border-b border-gray-100">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 animate-[fadeUp_0.6s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg shadow-green-600/30">
              <CheckCircle2 size={32} className="text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Thank you, {invoice.customer.name.split(' ')[0]}!</h1>
          <p className="mt-2 text-sm text-gray-500">Your order is confirmed. A receipt is heading to your inbox.</p>
        </div>

        <div className="my-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
            <Package size={20} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-500 mb-1 flex items-center gap-1.5">
              <Calendar size={11} /> Estimated delivery
            </p>
            <p className="text-lg font-bold text-gray-900">
              {new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              {' – '}
              {new Date(Date.now() + 5 * 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 pt-6 text-sm sm:grid-cols-2">
          <InfoRow label="Order ID" value={invoice.orderId} testId="invoice-order-id" />
          <InfoRow label="Placed at" value={new Date(invoice.placedAt).toLocaleString()} />
          <InfoRow label="Email" value={invoice.customer.email} />
          <InfoRow label="Ship to" value={invoice.customer.address} />
          <InfoRow label="Paid with" value={invoice.maskedCard} />
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            Items
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2">Product</th>
                <th className="py-2 text-center">Qty</th>
                <th className="py-2 text-right">Price</th>
                <th className="py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((i) => (
                <tr key={i.id} data-testid={`invoice-row-${i.id}`} className="border-b border-gray-50">
                  <td className="py-3 text-gray-900">{i.name}</td>
                  <td className="py-3 text-center">{i.quantity}</td>
                  <td className="py-3 text-right">${i.price.toFixed(2)}</td>
                  <td className="py-3 text-right font-semibold">${i.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-4 text-right font-bold">
                  Total
                </td>
                <td className="pt-4 text-right text-lg font-bold" data-testid="invoice-total">
                  ${invoice.total.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Printer size={16} /> Print invoice
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div>
      <p className="text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900" data-testid={testId}>
        {value}
      </p>
    </div>
  );
}
