import React, { useState, useEffect } from 'react';
import { FlaskConical, ShoppingCart, User, Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { SearchBar } from './SearchBar';
import { CartDrawer } from './CartDrawer';

interface NavbarProps {
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Trigger bump animation when total changes
  useEffect(() => {
    if (totalItems === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [totalItems]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const initials = user?.name?.trim().charAt(0).toUpperCase() ?? '';

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'border-gray-200 bg-white/80 backdrop-blur-md shadow-sm'
            : 'border-gray-100 bg-white'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 sm:gap-8">
            <div className="flex items-center gap-4">
              <button className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors">
                <Menu size={24} />
              </button>
              <Link
                to="/"
                className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 transition-transform hover:-rotate-1"
              >
                AURA.
              </Link>
            </div>

            <div className="flex-1 max-w-2xl hidden sm:block">
              <SearchBar onSearch={onSearch} />
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <Link
                to="/playground"
                className="hidden md:flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-950 transition-colors"
              >
                <FlaskConical size={18} />
                <span>Playground</span>
              </Link>

              {user ? (
                <div className="hidden sm:flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      Hi, {user.name}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <Link to="/auth" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  <User size={20} />
                  <span>Login / Register</span>
                </Link>
              )}

              <button
                onClick={() => setCartOpen(true)}
                className="flex items-center text-gray-700 hover:text-gray-900 transition-colors relative"
                aria-label="Open cart"
              >
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span
                    className={`absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-md ${
                      bump ? 'animate-cart-bump' : ''
                    }`}
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};
