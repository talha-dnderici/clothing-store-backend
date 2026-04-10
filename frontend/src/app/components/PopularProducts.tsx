import React from 'react';
import { Star, ShoppingCart, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { CatalogProduct } from '../types/catalog';
import { useCart } from '../context/CartContext';

interface PopularProductsProps {
  products: CatalogProduct[];
}

export const PopularProducts: React.FC<PopularProductsProps> = ({ products }) => {
  const { addToCart } = useCart();

  // Take top 6 by rating
  const popular = [...products]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

  if (popular.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-yellow-50 text-yellow-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Popular Right Now</h2>
            <p className="text-sm text-gray-500">Top-rated picks from our collection</p>
          </div>
        </div>
        <Link to="/" className="text-sm font-semibold text-black hover:underline underline-offset-4 hidden sm:block">
          View All →
        </Link>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
        {popular.map(product => {
          const isOutOfStock = product.stockQuantity === 0;

          return (
            <div
              key={product.id}
              className="flex-shrink-0 w-48 lg:w-auto snap-start group"
            >
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3">
                <Link to={`/product/${product.id}`}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                {isOutOfStock && (
                  <span className="absolute top-2 left-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Sold Out
                  </span>
                )}
                {!isOutOfStock && (
                  <button
                    onClick={() => addToCart({
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      stockQuantity: product.stockQuantity,
                    })}
                    className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingCart size={14} />
                  </button>
                )}
              </div>
              <Link to={`/product/${product.id}`} className="block">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-0.5">{product.category}</p>
                <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-black">{product.name}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex items-center gap-0.5">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">${product.price.toFixed(2)}</span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};
