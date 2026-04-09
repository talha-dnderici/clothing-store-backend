import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router';
import { FilterSection } from '../components/FilterSection';
import { ProductGrid } from '../components/ProductGrid';
import { HeroBanner } from '../components/HeroBanner';
import { PopularProducts } from '../components/PopularProducts';
import { api } from '../utils/api';
import { mapProducts } from '../utils/mapProduct';
import { MockProduct } from '../data/mockProducts';
import { mockProducts as fallbackProducts } from '../data/mockProducts';

export default function Home() {
  const { searchQuery, activeCategory } = useOutletContext<{
    searchQuery: string;
    activeCategory: string;
  }>();
  const [sortBy, setSortBy] = useState('');
  const [products, setProducts] = useState<MockProduct[]>(fallbackProducts);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products from API with search, sort, and category params
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const params: Record<string, string> = {};
    if (searchQuery) params.search = searchQuery;
    if (sortBy === 'PriceLow') params.sort = 'price_asc';
    else if (sortBy === 'PriceHigh') params.sort = 'price_desc';
    else if (sortBy === 'Rating') params.sort = 'rating';

    api.getProducts(params)
      .then(res => {
        if (!cancelled) {
          setProducts(mapProducts(res.data));
        }
      })
      .catch(() => {
        // Fallback to local mock data if API is unavailable
        if (!cancelled) {
          let fallback = [...fallbackProducts];

          if (searchQuery) {
            const term = searchQuery.toLowerCase();
            fallback = fallback.filter(
              p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term)
            );
          }

          if (sortBy === 'PriceLow') fallback.sort((a, b) => a.price - b.price);
          else if (sortBy === 'PriceHigh') fallback.sort((a, b) => b.price - a.price);
          else if (sortBy === 'Rating') fallback.sort((a, b) => b.rating - a.rating);

          setProducts(fallback);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [searchQuery, sortBy]);

  // Category filtering (applied client-side since backend may not have this param yet)
  const displayedProducts = activeCategory === 'All'
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div>
      {/* Hero Banner — only show when not searching */}
      {!searchQuery && <HeroBanner />}

      {/* Popular section — only show when on "All" with no search */}
      {!searchQuery && activeCategory === 'All' && (
        <PopularProducts products={products} />
      )}

      {/* Main product grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FilterSection sortBy={sortBy} setSortBy={setSortBy} count={displayedProducts.length} />
        <ProductGrid products={displayedProducts} isLoading={isLoading} />
      </div>
    </div>
  );
}
