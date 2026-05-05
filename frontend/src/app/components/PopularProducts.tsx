import React from 'react';
import { Star, ShoppingCart, TrendingUp, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { CatalogProduct } from '../types/catalog';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { LazyImage } from './LazyImage';

interface PopularProductsProps {
  products: CatalogProduct[];
}

export const PopularProducts: React.FC<PopularProductsProps> = ({ products }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const popular = [...products].sort((a, b) => b.rating - a.rating).slice(0, 6);
  if (popular.length === 0) return null;

  const quickAdd = (product: CatalogProduct) => {
    const ok = addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
    });
    if (ok) showToast({ title: 'Added to cart', description: product.name, image: product.imageUrl, variant: 'success' });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="flex items-end justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-700 shadow-inner">
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-amber-700 mb-1">Trending Now</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Most loved this week</h2>
          </div>
        </div>
        <Link to="/" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-black hover:gap-2.5 transition-all">
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-6 lg:overflow-visible lg:pb-0">
        {popular.map((product, idx) => {
          const isOutOfStock = product.stockQuantity === 0;
          return (
            <div key={product.id} className="flex-shrink-0 w-48 lg:w-auto snap-start group">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-3 shadow-sm group-hover:shadow-xl transition-shadow duration-300">
                <Link to={`/product/${product.id}`}>
                  <LazyImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  />
                </Link>
                <span className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm text-xs font-extrabold text-gray-900 shadow-md">
                  {idx + 1}
                </span>
                {isOutOfStock && (
                  <span className="absolute top-2 right-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Sold Out
                  </span>
                )}
                {!isOutOfStock && (
                  <button
                    onClick={() => quickAdd(product)}
                    className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-xl opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingCart size={16} />
                  </button>
                )}
              </div>
              <Link to={`/product/${product.id}`} className="block">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">{product.category}</p>
                <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between mt-1.5">
                  {product.rating > 0 ? (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-semibold text-gray-700">{product.rating}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">New</span>
                  )}
                  <span className="text-sm font-bold text-gray-900 tabular-nums">${product.price.toFixed(2)}</span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
};
