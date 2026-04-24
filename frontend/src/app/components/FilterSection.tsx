import React from 'react';
import { ChevronDown, SlidersHorizontal, LayoutGrid } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'Newest', label: 'Newest arrivals' },
  { value: 'Rating', label: 'Best reviewed' },
  { value: 'PriceLow', label: 'Price: Low to High' },
  { value: 'PriceHigh', label: 'Price: High to Low' },
];

export const FilterSection = ({
  sortBy,
  setSortBy,
  count,
}: {
  sortBy: string;
  setSortBy: (val: string) => void;
  count: number;
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 py-10 border-b border-gray-100 mb-8">
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2 flex items-center gap-1.5">
          <LayoutGrid size={12} /> Catalog
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          All Products
          <span className="ml-3 text-base font-medium text-gray-400 tabular-nums">{count} items</span>
        </h2>
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button className="flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all lg:hidden w-full">
          <SlidersHorizontal size={16} />
          Filters
        </button>

        <div className="relative hidden lg:block">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none cursor-pointer rounded-full border border-gray-200 bg-white py-2.5 pl-5 pr-12 text-sm font-semibold text-gray-800 hover:border-gray-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10 transition-all"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort: {o.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <ChevronDown size={16} className="text-gray-500" />
          </div>
        </div>
      </div>
    </div>
  );
};
