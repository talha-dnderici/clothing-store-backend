import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { Link, useOutletContext } from 'react-router';
import { MockProduct } from '../data/mockProducts';

interface ProductCardProps {
  product: MockProduct;
  stockQuantity: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, stockQuantity }) => {
  const isOutOfStock = stockQuantity === 0;
  const { setCartCount } = useOutletContext<{ setCartCount: React.Dispatch<React.SetStateAction<number>> }>();

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg border border-gray-100">
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {/* Out of stock overlay badge */}
        {isOutOfStock && (
          <div className="absolute left-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 uppercase tracking-wider shadow-sm">
            Sold Out
          </div>
        )}
      </div>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <p className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-widest font-semibold">{product.category}</p>
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
            <Link to={`/product/${product.id}`}>
              <span aria-hidden="true" className="absolute inset-0" />
              {product.name}
            </Link>
          </h3>

          {/* 5-Star Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} className="fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-xs text-gray-500 ml-1">(24)</span>
          </div>

          <div className="flex items-end justify-between mb-4">
            <p className="text-xl font-bold text-gray-800">${product.price.toFixed(2)}</p>
            {/* Stock Indicator */}
            <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-500' : 'text-green-600'}`}>
              {isOutOfStock ? 'Out of Stock' : `${stockQuantity} in Stock`}
            </span>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={() => setCartCount(prev => prev + 1)}
          disabled={isOutOfStock}
          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-lg py-3 px-4 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 ${
            isOutOfStock
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          <ShoppingCart size={18} />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};
