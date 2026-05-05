import React from 'react';
import { Link, useLocation } from 'react-router';
import { Compass, Home, ShoppingBag, Search } from 'lucide-react';

/**
 * Branded 404 page rendered for any unmatched route.
 *
 * Anchored to the same visual language as the rest of the catalog so a
 * misclick or stale URL still feels like part of the AURA store rather
 * than a raw browser/router error screen.
 */
export default function NotFound() {
  const location = useLocation();

  return (
    <div
      className="mx-auto max-w-3xl px-4 py-20 sm:py-28 text-center"
      data-testid="not-found-page"
    >
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 text-white shadow-lg shadow-black/20">
        <Compass size={36} strokeWidth={2.2} />
      </div>

      <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] text-gray-500">
        Error 404
      </p>
      <h1 className="mt-3 text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900">
        Lost in the wardrobe.
      </h1>
      <p className="mt-5 text-base sm:text-lg text-gray-500 max-w-md mx-auto">
        We couldn't find{' '}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-700">
          {location.pathname}
        </code>
        . The page may have moved, or you might be following an old link.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-black px-7 py-3 text-sm font-bold text-white shadow-lg hover:bg-gray-800 active:scale-95 transition-all"
        >
          <Home size={16} /> Back to home
        </Link>
        <Link
          to="/wishlist"
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
        >
          <ShoppingBag size={16} /> Open wishlist
        </Link>
      </div>

      <div className="mt-16 grid gap-3 text-left max-w-md mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center">
          Maybe try
        </p>
        <ul className="grid gap-2">
          <li>
            <Link
              to="/"
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition"
            >
              <Search size={14} className="text-gray-400" />
              Browse the full catalog
            </Link>
          </li>
          <li>
            <Link
              to="/orders"
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition"
            >
              <ShoppingBag size={14} className="text-gray-400" />
              Check on your orders
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
