import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { FilterSection } from '../components/FilterSection';
import { ProductGrid } from '../components/ProductGrid';
import { HeroBanner } from '../components/HeroBanner';
import { PopularProducts } from '../components/PopularProducts';
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

export default function Home() {
  const { searchQuery, activeCategory } = useOutletContext<{
    searchQuery: string;
    activeCategory: string;
  }>();
  const [sortBy, setSortBy] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setProducts([]);
    setTotalProducts(0);
    setPage(1);
  }, [activeCategory, searchQuery, sortBy]);

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
    params.limit = String(PRODUCTS_PER_PAGE);

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
  }, [activeCategory, page, searchQuery, sortBy]);

  const hasMoreProducts = products.length < totalProducts;
  const isInitialLoading = isLoading && page === 1;
  const isLoadingMore = isLoading && page > 1;

  return (
    <div>
      {!searchQuery && <HeroBanner />}

      {!searchQuery && activeCategory === 'All' && (
        <PopularProducts products={products} />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FilterSection sortBy={sortBy} setSortBy={setSortBy} count={totalProducts} />
        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <ProductGrid products={products} isLoading={isInitialLoading} />
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
    </div>
  );
}
