import React, { useState } from 'react';
import { ShoppingCart, User, Menu, LogOut } from 'lucide-react';
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

  return (
    <>
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4 sm:gap-8">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button className="lg:hidden text-gray-500 hover:text-gray-900">
                <Menu size={24} />
              </button>
              <Link to="/" className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                AURA.
              </Link>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl hidden sm:block">
              <SearchBar onSearch={onSearch} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 sm:gap-6">
              {user ? (
                <div className="hidden sm:flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">
                    Hi, {user.name}
                  </span>
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
              >
                <ShoppingCart size={24} />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm">
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

