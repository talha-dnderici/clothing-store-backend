import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import { CategoryMenu } from './components/CategoryMenu';

export default function Root() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar onSearch={handleSearch} />
      <CategoryMenu activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />

      <main className="flex-1">
        <Outlet context={{ searchQuery, activeCategory }} />
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
