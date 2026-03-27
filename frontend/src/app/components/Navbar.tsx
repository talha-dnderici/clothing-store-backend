import React from 'react';
import { Search, ShoppingCart, User, Menu, LogOut } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 sm:gap-8">
          {/* Logo / Brand */}
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
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products by name or description..."
                className="block w-full rounded-full border border-gray-300 bg-gray-50 py-2.5 pl-11 pr-4 text-sm placeholder:text-gray-500 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button className="sm:hidden text-gray-500 hover:text-gray-900">
              <Search size={24} />
            </button>
            
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

            <a href="#" className="flex items-center text-gray-700 hover:text-gray-900 transition-colors">
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white shadow-sm">
                  3
                </span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
