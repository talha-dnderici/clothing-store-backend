'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';
import { readStoredSession } from '../lib/session';

const shopLinks = [
  { href: '/', label: 'New Arrivals' },
  { href: '/', label: 'Women' },
  { href: '/', label: 'Men' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    async function loadCartCount() {
      const session = readStoredSession();

      if (!session?.user?.id) {
        setCartCount(0);
        return;
      }

      try {
        const cards = await apiRequest<
          Array<{ userId: string; items: Array<{ quantity: number }> }>
        >('/cards', {
          method: 'GET',
        });

        const totalCount = cards
          .filter((card) => card.userId === session.user.id)
          .flatMap((card) => card.items)
          .reduce((sum, item) => sum + Number(item.quantity || 0), 0);

        setCartCount(totalCount);
      } catch {
        setCartCount(0);
      }
    }

    void loadCartCount();
  }, [pathname]);

  return (
    <header className="header-shell">
      <div className="site-header">
        <div className="nav-cluster nav-left">
          <Link href="/" className="menu-trigger">
            <MenuIcon />
            <span>Menu</span>
          </Link>
          {shopLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="shop-link"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link href="/" className="brand-center">
          SWAG UP.
        </Link>

        <div className="nav-cluster nav-right">
          <button
            type="button"
            className={isSearchOpen ? 'icon-link is-active' : 'icon-link'}
            aria-label="Search"
            onClick={() => setIsSearchOpen((current) => !current)}
          >
            <SearchIcon />
          </button>
          <Link
            href="/login"
            className={pathname === '/login' ? 'icon-link is-active' : 'icon-link'}
            aria-label="Account"
          >
            <AccountIcon />
          </Link>
          <Link
            href="/cart"
            className={pathname === '/cart' ? 'icon-link is-active with-badge' : 'icon-link with-badge'}
            aria-label="Cart"
          >
            <CartIcon />
            <span>{cartCount}</span>
          </Link>
        </div>
      </div>

      {isSearchOpen ? (
        <div className="search-bar">
          <SearchIcon />
          <input placeholder="Search products, categories, or collections" />
        </div>
      ) : null}
    </header>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16L21 21" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M4.5 20c1.5-3.3 4.2-5 7.5-5s6 1.7 7.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7 7h13l-1.4 8.2H8.8L7 7Zm0 0-.8-2.6H3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="19" r="1.2" />
      <circle cx="17" cy="19" r="1.2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
