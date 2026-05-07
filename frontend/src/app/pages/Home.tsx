import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router';
import { FilterSection } from '../components/FilterSection';
import {
  FilterDrawer,
  EMPTY_FILTERS,
  countActiveFilters,
  ProductFilters,
} from '../components/FilterDrawer';
import { ProductGrid } from '../components/ProductGrid';
import { HeroBanner } from '../components/HeroBanner';
import { PopularProducts } from '../components/PopularProducts';
import { NewArrivals } from '../components/NewArrivals';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { api } from '../utils/api';
import { mapProducts } from '../utils/mapProduct';
import { CatalogProduct } from '../types/catalog';

type ProductsResponse = {
  items?: unknown[];
  total?: number;
  page?: number;
  limit?: number;
};

const PRODUCTS_PER_PAGE = 12;
// When a client-side filter is active, fetch the entire catalog (or close to it)
// so filtering doesn't only operate on the currently-paginated slice.
const ALL_PRODUCTS_LIMIT = 200;

// Backend categories include both "type" categories (Hoodies, Jeans, …) and
// "gender" categories (Men, Women, Unisex). We split them by name so the
// filter drawer can render two separate facet groups.
const GENDER_CATEGORY_NAMES = ['Men', 'Women', 'Unisex'];

function isGenderCategory(name: string): boolean {
  return GENDER_CATEGORY_NAMES.includes(name);
}

/**
 * Apply client-side filters (price range, type, gender) to a product list.
 *
 * Type and gender are matched by walking the product's `categories` array
 * (multi-category support — a hoodie can be both "Hoodies" and "Men"). When
 * multiple values are selected within a facet, they're OR'd; across facets
 * they're AND'd.
 */
function applyClientFilters(
  products: CatalogProduct[],
  filters: ProductFilters,
): CatalogProduct[] {
  return products.filter((product) => {
    // Price range
    if (filters.priceMin !== null && product.price < filters.priceMin) return false;
    if (filters.priceMax !== null && product.price > filters.priceMax) return false;

    // Type / gender via product.categories — `mapProduct` normalises this to
    // `string[]` (e.g. ["Hoodies", "Men"]). Falls back to the singular
    // category if the array is missing.
    const productCategoryNames: string[] =
      Array.isArray(product.categories) && product.categories.length > 0
        ? product.categories
        : product.category
        ? [product.category]
        : [];

    if (filters.types.length > 0) {
      const matchesType = filters.types.some((t) => productCategoryNames.includes(t));
      if (!matchesType) return false;
    }

    if (filters.genders.length > 0) {
      const matchesGender = filters.genders.some((g) =>
        productCategoryNames.includes(g),
      );
      if (!matchesGender) return false;
    }

    return true;
  });
}

export default function Home() {
  const { searchQuery, activeCategory, categories, clearFilters } = useOutletContext<{
    searchQuery: string;
    activeCategory: string;
    categories: string[];
    clearFilters: () => void;
  }>();

  const [sortBy, setSortBy] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Catalog filter state — separate from the top-level category bar / search.
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const activeFilterCount = countActiveFilters(filters);
  const filtersActive = activeFilterCount > 0;

  // Derive the type/gender option lists from the categories array provided by
  // Root. Falls back to a sensible default if categories haven't loaded yet.
  const { typeOptions, genderOptions } = useMemo(() => {
    const known = (categories ?? []).filter((c) => c && c !== 'All');
    const genders = known.filter(isGenderCategory);
    const types = known.filter((c) => !isGenderCategory(c));
    return {
      typeOptions: types.length > 0 ? types : [],
      genderOptions: genders.length > 0 ? genders : GENDER_CATEGORY_NAMES,
    };
  }, [categories]);

  // Reset pagination whenever the query inputs change.
  useEffect(() => {
    setProducts([]);
    setTotalProducts(0);
    setPage(1);
  }, [activeCategory, searchQuery, sortBy, filtersActive]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setErrorMessage('');

    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (activeCategory !== 'All') params.category = activeCategory;
    if (sortBy === 'PriceLow') params.sort = 'price_asc';
    else if (sortBy === 'PriceHigh') params.sort = 'price_desc';
    else if (sortBy === 'Rating') params.sort = 'popularity';
    params.page = String(page);
    // When filters are active, fetch (almost) everything so client-side
    // filtering operates over the full catalog rather than a paginated slice.
    params.limit = String(filtersActive ? ALL_PRODUCTS_LIMIT : PRODUCTS_PER_PAGE);

    api.getProducts(params)
      .then(res => {
        if (!cancelled) {
          const payload = res.data as ProductsResponse;
          const mappedProducts = mapProducts(payload.items ?? []);
          setTotalProducts(payload.total ?? mappedProducts.length);
          setProducts(currentProducts =>
            page === 1 ? mappedProducts : [...currentProducts, ...mappedProducts]
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setTotalProducts(0);
          setErrorMessage('Products could not be loaded from the database.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeCategory, page, searchQuery, sortBy, filtersActive]);

  // Client-side filter pipeline.
  const filteredProducts = useMemo(
    () => (filtersActive ? applyClientFilters(products, filters) : products),
    [products, filters, filtersActive],
  );

  const displayedCount = filtersActive ? filteredProducts.length : totalProducts;
  const hasMoreProducts =
    !filtersActive && products.length < totalProducts;
  const isInitialLoading = isLoading && page === 1;
  const isLoadingMore = isLoading && page > 1;

  const handleClearAllFilters = () => {
    setFilters(EMPTY_FILTERS);
    clearFilters();
  };

  return (
    <div>
      {!searchQuery && activeCategory === 'All' && !filtersActive && <HeroBanner />}

      {!searchQuery && activeCategory === 'All' && !filtersActive && (
        <>
          <NewArrivals products={products} />
          <PopularProducts products={products} />
        </>
      )}

      <div id="products" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 scroll-mt-28">
        <FilterSection
          sortBy={sortBy}
          setSortBy={setSortBy}
          count={displayedCount}
          activeCategory={activeCategory}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setFilterDrawerOpen(true)}
        />

        {filtersActive && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-gray-500">Active filters:</span>
            {filters.priceMin !== null || filters.priceMax !== null ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                $ {filters.priceMin ?? 0}
                {filters.priceMax !== null ? ` — $${filters.priceMax}` : '+'}
              </span>
            ) : null}
            {filters.types.map((t) => (
              <span
                key={`type-${t}`}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700"
              >
                {t}
              </span>
            ))}
            {filters.genders.map((g) => (
              <span
                key={`gender-${g}`}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700"
              >
                {g}
              </span>
            ))}
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="ml-1 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-black underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <ProductGrid
          products={filteredProducts}
          isLoading={isInitialLoading}
          onClearFilters={
            searchQuery || activeCategory !== 'All' || filtersActive
              ? handleClearAllFilters
              : undefined
          }
        />

        {!errorMessage && hasMoreProducts ? (
          <div className="pb-12 text-center">
            <button
              type="button"
              onClick={() => setPage(currentPage => currentPage + 1)}
              disabled={isLoadingMore}
              className="rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoadingMore ? 'Loading...' : 'Load More Products'}
            </button>
          </div>
        ) : null}
      </div>

      <RecentlyViewed />

      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onApply={setFilters}
        typeOptions={typeOptions}
        genderOptions={genderOptions}
      />
    </div>
  );
}
