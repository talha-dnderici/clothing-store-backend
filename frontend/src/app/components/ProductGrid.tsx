import React from 'react';
import { ProductCard } from './ProductCard';
import { MockProduct } from '../data/mockProducts';

export const ProductGrid = ({ products }: { products: MockProduct[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8 mb-16">
      {products.map((product) => (
        <ProductCard 
          key={product.id} 
          product={product} 
          stockQuantity={product.stockQuantity} 
        />
      ))}
    </div>
  );
};
