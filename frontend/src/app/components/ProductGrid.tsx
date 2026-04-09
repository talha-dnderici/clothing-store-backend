import React from 'react';
import { MockProduct } from '../data/mockProducts';
import { ProductCard } from './ProductCard';
import { PackageSearch } from 'lucide-react';

interface ProductGridProps {
  products: MockProduct[];
  isLoading?: boolean;
}

// Skeleton card for loading state
const SkeletonCard = () => (
  <div className="flex flex-col overflow-hidden rounded-xl bg-white shadow-sm border border-gray-100 animate-pulse">
    <div className="aspect-[4/5] w-full bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-16 rounded bg-gray-200" />
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="h-3 w-1/2 rounded bg-gray-200" />
      <div className="h-10 w-full rounded-lg bg-gray-200 mt-4" />
    </div>
  </div>
);

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pb-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center mb-5">
          <PackageSearch size={36} className="text-gray-300" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No products found</h3>
        <p className="text-sm text-gray-500 max-w-sm">Try adjusting your search or filter to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pb-12">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
