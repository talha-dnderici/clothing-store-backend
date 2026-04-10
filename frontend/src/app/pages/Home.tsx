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
};

export default function Home() {
  const { searchQuery, activeCategory } = useOutletContext<{
    searchQuery: string;
    activeCategory: string;
  }>();
  const [sortBy, setSortBy] = useState('');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

    api.getProducts(params)
      .then(res => {
        if (!cancelled) {
          const payload = res.data as ProductsResponse;
          setProducts(mapProducts(payload.items ?? []));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setErrorMessage('Products could not be loaded from the database.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [activeCategory, searchQuery, sortBy]);

  return (
    <div>
      {!searchQuery && <HeroBanner />}

      {!searchQuery && activeCategory === 'All' && (
        <PopularProducts products={products} />
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FilterSection sortBy={sortBy} setSortBy={setSortBy} count={products.length} />
        {errorMessage ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <ProductGrid products={products} isLoading={isLoading} />
      </div>
    </div>
  );
}
