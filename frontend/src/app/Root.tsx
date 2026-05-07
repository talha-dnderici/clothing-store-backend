import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { Navbar } from './components/Navbar';
import { CategoryMenu } from './components/CategoryMenu';
import { api } from './utils/api';
import { CatalogCategory } from './types/catalog';

export default function Root() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    api.getCategories()
      .then((res) => {
        if (cancelled) {
          return;
        }

        const names = (Array.isArray(res.data) ? res.data : [])
          .map((category: CatalogCategory) => category.name?.trim())
          .filter((name: string | undefined): name is string => Boolean(name));

        setCategories(['All', ...new Set(names)]);
      })
      .catch(() => {
        if (!cancelled) {
          setCategories(['All']);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery((prev) => {
      if (prev !== query && location.pathname !== '/') navigate('/');
      return query;
    });
  }, [location.pathname, navigate]);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory((prev) => {
      if (prev !== category && location.pathname !== '/') navigate('/');
      return category;
    });
  }, [location.pathname, navigate]);

  const handleLogoClick = useCallback(() => {
    setSearchQuery('');
    setActiveCategory('All');
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar onSearch={handleSearch} onLogoClick={handleLogoClick} />
      <CategoryMenu
        activeCategory={activeCategory}
        categories={categories}
        onCategoryChange={handleCategoryChange}
      />

      <main className="flex-1">
        <Outlet context={{
          searchQuery,
          activeCategory,
          categories,
          clearFilters: () => { setSearchQuery(''); setActiveCategory('All'); },
        }} />
      </main>

      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 mb-10">
            <div className="col-span-2">
              <div className="text-2xl font-extrabold tracking-tight text-gray-900 mb-3">AURA.</div>
              <p className="text-sm text-gray-500 max-w-xs mb-4">
                Premium clothing for people who wear their own story.
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex max-w-sm gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all"
                />
                <button className="rounded-full bg-black px-5 py-2 text-sm font-bold text-white hover:bg-gray-800 active:scale-95 transition-all">
                  Join
                </button>
              </form>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-3">Shop</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('All')}
                    className="hover:text-black transition-colors text-left"
                  >
                    New Arrivals
                  </button>
                </li>
                {categories.filter((c) => c !== 'All').map((cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className="hover:text-black transition-colors text-left"
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-3">Help</p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-black transition-colors">Shipping</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Returns</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Size guide</a></li>
                <li><a href="#" className="hover:text-black transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} AURA Clothing. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
              <a href="#" className="hover:text-black transition-colors">Terms</a>
              <a href="#" className="hover:text-black transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
