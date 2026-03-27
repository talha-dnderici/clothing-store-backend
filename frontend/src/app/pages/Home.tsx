import React, { useState } from 'react';
import { useOutletContext } from 'react-router';
import { FilterSection } from '../components/FilterSection';
import { ProductGrid } from '../components/ProductGrid';
import { mockProducts } from '../data/mockProducts';

export default function Home() {
  const { searchQuery } = useOutletContext<{ searchQuery: string }>();
  const [sortBy, setSortBy] = useState('');

  let displayedProducts = mockProducts.filter(p => 
    p.name.toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    p.description.toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  if (sortBy === 'PriceLow') {
    displayedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'PriceHigh') {
    displayedProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'Rating') {
    displayedProducts.sort((a, b) => b.rating - a.rating);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <FilterSection sortBy={sortBy} setSortBy={setSortBy} count={displayedProducts.length} />
      <ProductGrid products={displayedProducts} />
    </div>
  );
}
