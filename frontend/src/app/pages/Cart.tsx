import React from 'react';
import { Link, useNavigate } from 'react-router';
import { Minus, Plus, Trash2, ShoppingBag, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

/**
 * FE-8 (SCRUM-36) — Shopping cart page.
 * If the user is a guest, clicking "Proceed to Checkout" prompts them to log in
 * and redirects to /auth, preserving the intent to return to checkout.
 */
export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      // Guest — redirect to login with checkout as the return target.
      navigate('/auth?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center" data-testid="cart-empty">
        <ShoppingBag size={56} className="mx-auto text-gray-300" strokeWidth={1} />
        <h1 className="mt-6 text-2xl font-bold text-gray-900">Your cart is empty</h1>
        <p className="mt-2 text-sm text-gray-500">
          Browse our catalog and add something you love.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10" data-testid="cart-page">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart ({totalItems})</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              data-testid={`cart-row-${item.id}`}
              className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">${item.price.toFixed(2)} each</p>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    aria-label="decrease"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="rounded-md border border-gray-200 p-1.5 hover:bg-gray-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold" data-testid={`qty-${item.id}`}>
                    {item.quantity}
                  </span>
                  <button
                    aria-label="increase"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stockQuantity}
                    className="rounded-md border border-gray-200 p-1.5 hover:bg-gray-50 disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button
                  aria-label={`remove ${item.name}`}
                  onClick={() => removeFromCart(item.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={18} />
                </button>
                <p className="font-bold text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}

          <button
            onClick={clearCart}
            className="text-sm text-gray-500 hover:text-red-500"
          >
            Clear cart
          </button>
        </div>

        {/* Summary */}
        <aside className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm h-fit space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold" data-testid="cart-subtotal">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Shipping</span>
              <span className="text-gray-400">Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
          </div>

          {!user && (
            <div
              data-testid="guest-notice"
              className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"
            >
              <LogIn size={14} className="mt-0.5 flex-shrink-0" />
              <span>You need to be signed in to complete your purchase.</span>
            </div>
          )}

          <button
            data-testid="checkout-btn"
            onClick={handleCheckout}
            className="w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white hover:bg-gray-800"
          >
            {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
          </button>
        </aside>
      </div>
    </div>
  );
}
