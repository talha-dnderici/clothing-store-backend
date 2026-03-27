import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import { CategoryMenu } from './components/CategoryMenu';

export default function Root() {
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-black selection:text-white flex flex-col">
      <Navbar cartCount={cartCount} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CategoryMenu />
      
      <main className="flex-1">
        <Outlet context={{ cartCount, setCartCount, searchQuery, setSearchQuery }} />
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
