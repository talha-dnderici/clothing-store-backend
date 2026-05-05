import React from 'react';
import { CatalogProduct } from '../types/catalog';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { EmptyState } from './EmptyState';

interface ProductGridProps {
  products: CatalogProduct[];
  isLoading?: boolean;
  onClearFilters?: () => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading, onClearFilters }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pb-12">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <EmptyState
        title="No products found"
        description="Try a different search or category."
        actionLabel={onClearFilters ? 'Clear filters' : undefined}
        onAction={onClearFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 pb-12">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
};
