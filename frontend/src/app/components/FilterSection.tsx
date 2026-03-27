import React from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';

export const FilterSection = ({ sortBy, setSortBy, count }: { sortBy: string, setSortBy: (val: string) => void, count: number }) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-8">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-bold text-gray-900">All Products</h2>
        <span className="text-sm font-medium text-gray-500 mt-1">({count} items)</span>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* Mobile Filter Button */}
        <button className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black lg:hidden w-full transition-colors">
          <SlidersHorizontal size={16} />
          Filters
        </button>

        {/* Desktop Sort Dropdowns */}
        <div className="relative hidden lg:block">
          <select 
            value={sortBy.startsWith('Price') ? '' : sortBy}
            onChange={(e) => { if (e.target.value) setSortBy(e.target.value); }}
            className="appearance-none cursor-pointer rounded-md border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
          >
            <option value="">Sort by Popularity</option>
            <option value="Newest">Newest First</option>
            <option value="Rating">Customer Rating</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>

        <div className="relative hidden lg:block">
          <select 
            value={sortBy.startsWith('Price') ? sortBy : ''}
            onChange={(e) => { if (e.target.value) setSortBy(e.target.value); }}
            className="appearance-none cursor-pointer rounded-md border border-gray-300 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:border-black focus:outline-none focus:ring-1 focus:ring-black transition-colors"
          >
            <option value="">Sort by Price</option>
            <option value="PriceLow">Price: Low to High</option>
            <option value="PriceHigh">Price: High to Low</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
