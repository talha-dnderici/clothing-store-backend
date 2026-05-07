import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  LayoutGrid,
  SlidersHorizontal,
  X,
} from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'Newest', label: 'Newest arrivals' },
  { value: 'Rating', label: 'Popularity' },
  { value: 'PriceLow', label: 'Price: Low to High' },
  { value: 'PriceHigh', label: 'Price: High to Low' },
];

interface FilterSectionProps {
  sortBy: string;
  setSortBy: (val: string) => void;
  count: number;
  activeCategory?: string;
  /** Number of currently-applied catalog filters (price, type, gender). Drives the badge. */
  activeFilterCount?: number;
  /** Opens the catalog filter drawer (price, type, gender). */
  onOpenFilters?: () => void;
}

/**
 * Catalog header that hosts:
 *   • Title + product count
 *   • A standalone **Sort** dropdown (Featured / Newest / Best reviewed / Price low/high)
 *   • A standalone **Filters** button which opens the multi-facet drawer
 *     (price range, clothing type, gender) — see `FilterDrawer`.
 *
 * Sort is treated as a backend-driven concern (it maps to the `sort` query param).
 * Filters are local-state-only; the parent applies them client-side after fetching.
 */
export const FilterSection = ({
  sortBy,
  setSortBy,
  count,
  activeCategory,
  activeFilterCount = 0,
  onOpenFilters,
}: FilterSectionProps) => {
  const title =
    !activeCategory || activeCategory === 'All' ? 'All Products' : activeCategory;

  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside-click / Escape.
  useEffect(() => {
    if (!sortOpen) return;
    const onClick = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSortOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [sortOpen]);

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Featured';

  return (
    <div className="py-10 border-b border-gray-100 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-gray-500 mb-2 flex items-center gap-1.5">
            <LayoutGrid size={12} /> Catalog
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            {title}
            <span className="ml-3 text-base font-medium text-gray-400 tabular-nums">
              {count} items
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Sort — custom dropdown */}
          <div className="relative flex-1 sm:flex-none" ref={sortRef}>
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={sortOpen}
              data-testid="sort-toggle"
              className="flex w-full items-center justify-between gap-2 rounded-full border border-gray-200 bg-white pl-5 pr-3 py-2.5 text-sm font-semibold text-gray-800 hover:border-gray-400 active:scale-95 transition-all"
            >
              <span className="flex items-center gap-2">
                <ArrowUpDown size={14} className="text-gray-500" />
                <span className="hidden sm:inline text-gray-500 font-medium">Sort:</span>
                <span>{currentSortLabel}</span>
              </span>
              <ChevronDown
                size={16}
                className={`text-gray-500 transition-transform ${sortOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {sortOpen && (
              <div
                role="menu"
                data-testid="sort-menu"
                className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-gray-100 bg-white p-1.5 shadow-2xl shadow-black/10 ring-1 ring-black/5 z-30 animate-[fadeIn_0.15s_ease-out]"
              >
                {SORT_OPTIONS.map((o) => {
                  const selected = sortBy === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setSortBy(o.value);
                        setSortOpen(false);
                      }}
                      data-testid={`sort-option-${o.value || 'featured'}`}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        selected
                          ? 'bg-black text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{o.label}</span>
                      {selected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filters — opens the multi-facet drawer */}
          <button
            type="button"
            onClick={onOpenFilters}
            data-testid="filters-toggle"
            className="relative flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 active:scale-95 transition-all"
          >
            <SlidersHorizontal size={15} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export { SORT_OPTIONS };
