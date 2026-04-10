import React, { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import { CategoryMenu } from './components/CategoryMenu';
import { api } from './utils/api';
import { CatalogCategory } from './types/catalog';

export default function Root() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);

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
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar onSearch={handleSearch} />
      <CategoryMenu
        activeCategory={activeCategory}
        categories={categories}
        onCategoryChange={handleCategoryChange}
      />

      <main className="flex-1">
        <Outlet context={{ searchQuery, activeCategory, categories }} />
      </main>

      <footer className="border-t border-gray-200 bg-white py-12 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500 flex flex-col items-center justify-center gap-4">
          <div className="text-xl font-bold tracking-tight text-gray-900">AURA.</div>
          <p>&copy; {new Date().getFullYear()} AURA Clothing. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
