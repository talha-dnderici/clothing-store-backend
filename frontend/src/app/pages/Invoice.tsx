import React from 'react';
import { Link, useLocation, Navigate } from 'react-router';
import { CheckCircle2, Printer } from 'lucide-react';

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
        <div className="flex items-center gap-3 text-green-600">
          <CheckCircle2 size={36} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Confirmed</h1>
            <p className="text-sm text-gray-500">
              Thanks for your order, {invoice.customer.name}.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-2 border-t border-gray-100 pt-6 text-sm sm:grid-cols-2">
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
