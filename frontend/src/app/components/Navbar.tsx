import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  ShoppingCart,
  User,
  Menu,
  LogOut,
  Heart,
  ChevronDown,
  Package,
  Settings,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { SearchBar } from './SearchBar';
import { CartDrawer } from './CartDrawer';
import { isAdminEmail } from '../utils/admin';

interface NavbarProps {
  onSearch: (query: string) => void;
  onLogoClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, onLogoClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const wishlistCount = wishlist.length;
  const [cartOpen, setCartOpen] = useState(false);
  const [bump, setBump] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, [menuOpen]);

  const isAdmin = isAdminEmail(user?.email);

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
              <button
                type="button"
                onClick={() => {
                  onLogoClick?.();
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 transition-transform hover:-rotate-1 cursor-pointer bg-transparent border-0 p-0"
                data-testid="aura-logo"
              >
                AURA.
              </button>
            </div>

            <div className="flex-1 max-w-2xl hidden sm:block">
              <SearchBar onSearch={onSearch} />
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              {isAdmin && (
                <Link
                  to="/playground"
                  className="hidden md:flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                  data-testid="admin-playground-link"
                >
                  <FlaskConical size={18} />
                  <span>Manager Playground</span>
                </Link>
              )}

              {user ? (
                <div className="hidden sm:block relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    data-testid="user-menu-trigger"
                    className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-xs font-bold text-white shadow-sm ring-2 ring-white">
                      {initials}
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      Hi, {user.name}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      data-testid="user-menu"
                      className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl shadow-black/10 ring-1 ring-black/5 animate-[fadeIn_0.15s_ease-out]"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 mb-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/orders"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Package size={16} className="text-gray-500" />
                        My Orders
                      </Link>
                      <Link
                        to="/wishlist"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <Heart size={16} className="text-gray-500" />
                        Wishlist
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/playground"
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Settings size={16} className="text-emerald-600" />
                          Admin Playground
                        </Link>
                      )}
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        role="menuitem"
                        data-testid="logout-btn"
                        onClick={() => {
                          setMenuOpen(false);
                          localStorage.removeItem('token');
                          logout();
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/auth" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  <User size={20} />
                  <span>Login / Register</span>
                </Link>
              )}

              {/* wishlist route */}
              <Link
                to="/wishlist"
                className="relative flex items-center text-gray-700 hover:text-red-500 transition-colors"
                aria-label={
                  wishlistCount > 0
                    ? `Wishlist (${wishlistCount} item${wishlistCount === 1 ? '' : 's'})`
                    : 'Wishlist'
                }
              >
                <Heart
                  size={22}
                  className={wishlistCount > 0 ? 'fill-red-500 text-red-500' : ''}
                />
                {wishlistCount > 0 && (
                  <span
                    data-testid="wishlist-count"
                    className="absolute -right-1.5 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md ring-2 ring-white"
                  >
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>

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
