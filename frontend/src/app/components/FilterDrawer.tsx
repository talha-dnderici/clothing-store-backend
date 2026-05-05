import React, { useEffect, useState } from 'react';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';

export type ProductFilters = {
  priceMin: number | null;
  priceMax: number | null;
  types: string[];
  genders: string[];
};

export const EMPTY_FILTERS: ProductFilters = {
  priceMin: null,
  priceMax: null,
  types: [],
  genders: [],
};

export function countActiveFilters(filters: ProductFilters): number {
  let n = 0;
  if (filters.priceMin !== null || filters.priceMax !== null) n += 1;
  n += filters.types.length;
  n += filters.genders.length;
  return n;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  /** All available type-style category names from the backend (Hoodies, Jeans, …). */
  typeOptions: string[];
  /** All available gender-style category names (Men, Women, Unisex). */
  genderOptions: string[];
}

const PRICE_PRESETS: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: 'Under $50', min: null, max: 50 },
  { label: '$50 — $100', min: 50, max: 100 },
  { label: '$100 — $200', min: 100, max: 200 },
  { label: 'Over $200', min: 200, max: null },
];

/**
 * Slide-in catalog filter drawer. Holds a *draft* set of filters locally so
 * the customer can tweak min/max and chip selections without firing a re-fetch
 * on every keystroke. The committed state is only published via `onApply`.
 *
 * Filters managed here:
 *   • Price range  (min / max numeric inputs + quick presets)
 *   • Type         (Hoodies, Jeans, T-Shirts, …) — multi-select chips
 *   • Gender       (Men / Women / Unisex)        — multi-select chips
 */
export function FilterDrawer({
  isOpen,
  onClose,
  filters,
  onApply,
  typeOptions,
  genderOptions,
}: FilterDrawerProps) {
  const [draft, setDraft] = useState<ProductFilters>(filters);

  // Sync draft when the parent's committed filters change (e.g., "Clear all"
  // applied from outside) or when the drawer is re-opened.
  useEffect(() => {
    if (isOpen) setDraft(filters);
  }, [isOpen, filters]);

  // Lock body scroll while open + close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  const toggleArrayValue = (key: 'types' | 'genders', value: string) => {
    setDraft((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const setPreset = (min: number | null, max: number | null) => {
    setDraft((prev) => ({ ...prev, priceMin: min, priceMax: max }));
  };

  const handleClearAll = () => setDraft(EMPTY_FILTERS);

  const handleApply = () => {
    // Coerce empty/invalid numeric inputs to null so they're treated as "no filter".
    const cleaned: ProductFilters = {
      ...draft,
      priceMin:
        draft.priceMin !== null && Number.isFinite(draft.priceMin) && draft.priceMin > 0
          ? draft.priceMin
          : null,
      priceMax:
        draft.priceMax !== null && Number.isFinite(draft.priceMax) && draft.priceMax > 0
          ? draft.priceMax
          : null,
    };
    onApply(cleaned);
    onClose();
  };

  const draftActiveCount = countActiveFilters(draft);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm transition-opacity ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Filters"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 right-0 z-[91] w-full sm:w-[420px] bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        data-testid="filter-drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-gray-900">
            <SlidersHorizontal size={18} /> Filters
            {draftActiveCount > 0 && (
              <span className="ml-1 rounded-full bg-black px-2 py-0.5 text-[11px] font-bold text-white">
                {draftActiveCount}
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {/* Price */}
          <section>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
              Price (USD)
            </h3>
            <div className="flex items-center gap-2">
              <label className="relative flex-1">
                <span className="sr-only">Minimum price</span>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Min"
                  value={draft.priceMin ?? ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      priceMin: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-7 pr-3 text-sm font-semibold text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  data-testid="filter-price-min"
                />
              </label>
              <span className="text-sm text-gray-400">—</span>
              <label className="relative flex-1">
                <span className="sr-only">Maximum price</span>
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="Max"
                  value={draft.priceMax ?? ''}
                  onChange={(e) =>
                    setDraft((p) => ({
                      ...p,
                      priceMax: e.target.value === '' ? null : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-7 pr-3 text-sm font-semibold text-gray-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  data-testid="filter-price-max"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRICE_PRESETS.map((preset) => {
                const selected =
                  draft.priceMin === preset.min && draft.priceMax === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPreset(preset.min, preset.max)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? 'border-black bg-black text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Type */}
          {typeOptions.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                Clothing type
              </h3>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((type) => {
                  const selected = draft.types.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleArrayValue('types', type)}
                      data-testid={`filter-type-${type.toLowerCase()}`}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                        selected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Gender */}
          {genderOptions.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">
                Gender
              </h3>
              <div className="flex flex-wrap gap-2">
                {genderOptions.map((gender) => {
                  const selected = draft.genders.includes(gender);
                  return (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => toggleArrayValue('genders', gender)}
                      data-testid={`filter-gender-${gender.toLowerCase()}`}
                      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                        selected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {gender}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gradient-to-b from-white to-gray-50 px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            disabled={draftActiveCount === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <RotateCcw size={14} /> Clear all
          </button>
          <button
            type="button"
            onClick={handleApply}
            data-testid="filter-apply"
            className="flex-1 rounded-full bg-black px-5 py-3 text-sm font-bold text-white shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all"
          >
            Apply{draftActiveCount > 0 ? ` (${draftActiveCount})` : ''}
          </button>
        </div>
      </aside>
    </>
  );
}
