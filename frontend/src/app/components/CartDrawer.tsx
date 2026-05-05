import React, { useEffect } from 'react';
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Truck, PartyPopper } from 'lucide-react';

const FREE_SHIPPING_THRESHOLD = 100;
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { LazyImage } from './LazyImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleCheckout = () => {
    onClose();
    if (!user) {
      navigate('/auth?redirect=/checkout');
      return;
    }
    navigate('/checkout');
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[70] shadow-2xl transform transition-transform duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={20} /> Your Cart
            {items.length > 0 && (
              <span className="ml-1 rounded-full bg-black text-white text-[10px] font-bold px-2 py-0.5">
                {items.length}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors active:scale-90"
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                <ShoppingBag size={40} strokeWidth={1.5} className="text-gray-300" />
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">Your cart is empty</p>
                <p className="text-xs text-gray-500 mt-1">Add something you love.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  style={{ animationDelay: `${idx * 40}ms` }}
                  className="animate-fade-up flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-3 transition-all hover:bg-white hover:shadow-sm hover:border-gray-200"
                >
                  <LazyImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-sm font-bold text-gray-700 mt-1">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="rounded-md border border-gray-200 bg-white p-1 text-gray-500 hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-30"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center tabular-nums">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stockQuantity}
                        className="rounded-md border border-gray-200 bg-white p-1 text-gray-500 hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-30"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="self-start rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors active:scale-90"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5 space-y-4 bg-gradient-to-b from-white to-gray-50">
            {/* Free shipping progress — encourages cart growth past the threshold */}
            {(() => {
              const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
              const pct = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);
              const unlocked = remaining === 0;
              return (
                <div
                  data-testid="free-shipping-progress"
                  className={`rounded-xl border px-3 py-2.5 ${
                    unlocked
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold mb-1.5">
                    {unlocked ? (
                      <>
                        <PartyPopper size={14} className="text-emerald-600" />
                        <span className="text-emerald-700">
                          You unlocked <span className="font-bold">free shipping</span>!
                        </span>
                      </>
                    ) : (
                      <>
                        <Truck size={14} className="text-gray-500" />
                        <span className="text-gray-700">
                          Add{' '}
                          <span className="font-bold tabular-nums text-gray-900">
                            ${remaining.toFixed(2)}
                          </span>{' '}
                          more for free shipping
                        </span>
                      </>
                    )}
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full transition-all duration-500 ${
                        unlocked ? 'bg-emerald-500' : 'bg-black'
                      }`}
                      style={{ width: `${pct}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })()}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Subtotal</span>
              <span className="text-xl font-bold text-gray-900 tabular-nums">${totalPrice.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400 -mt-2">Shipping & taxes calculated at checkout.</p>
            <button
              data-testid="drawer-checkout-btn"
              onClick={handleCheckout}
              className="group w-full rounded-xl bg-black py-3.5 text-sm font-bold text-white shadow-lg shadow-black/20 hover:bg-gray-800 hover:shadow-xl hover:shadow-black/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {user ? 'Checkout' : 'Sign in to Checkout'}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={clearCart}
              className="w-full text-center text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
};
