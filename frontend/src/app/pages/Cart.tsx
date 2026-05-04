import React from 'react';
import { Link, useNavigate } from 'react-router';
import { Minus, Plus, Trash2, ShoppingBag, LogIn, Truck, Shield, RotateCcw, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * FE-8 (SCRUM-36) — Shopping cart page.
 * If the user is a guest, clicking "Proceed to Checkout" prompts them to log in
 * and redirects to /auth, preserving the intent to return to checkout.
 */
export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart, totalItems } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
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
        <h1 className="mt-6 text-3xl font-extrabold text-gray-900 tracking-tight">Your cart is empty</h1>
        <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto">
          Looks like you haven't added anything yet. Browse the catalog and find something that speaks to you.
        </p>
        <Link
          to="/"
          className="group mt-8 inline-flex items-center gap-2 rounded-full bg-black px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-gray-800 hover:shadow-xl transition-all"
        >
          Start shopping
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
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
                  onClick={() => {
                    removeFromCart(item.id);
                    showToast({ title: 'Removed from cart', description: item.name, variant: 'info' });
                  }}
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

          {totalPrice < 100 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <div className="flex justify-between text-xs font-semibold text-amber-900 mb-1.5">
                <span>Free shipping at $100</span>
                <span>${(100 - totalPrice).toFixed(2)} to go</span>
              </div>
              <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, (totalPrice / 100) * 100)}%` }}
                />
              </div>
            </div>
          )}
          {totalPrice >= 100 && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs font-semibold text-green-800 flex items-center gap-2">
              <Truck size={14} /> Free shipping unlocked
            </div>
          )}

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

          <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <Shield size={18} className="mx-auto text-gray-400" />
              <p className="mt-1 text-[10px] font-semibold text-gray-500">Secure<br/>Checkout</p>
            </div>
            <div>
              <RotateCcw size={18} className="mx-auto text-gray-400" />
              <p className="mt-1 text-[10px] font-semibold text-gray-500">30-day<br/>Returns</p>
            </div>
            <div>
              <Truck size={18} className="mx-auto text-gray-400" />
              <p className="mt-1 text-[10px] font-semibold text-gray-500">Fast<br/>Delivery</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
