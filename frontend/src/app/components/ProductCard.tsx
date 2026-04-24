import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { Link } from 'react-router';
import { CatalogProduct } from '../types/catalog';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: CatalogProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const displayPrice = product.effectivePrice ?? product.price;

  return (
    <div
      data-testid="product-card"
      data-out-of-stock={isOutOfStock ? 'true' : 'false'}
      aria-disabled={isOutOfStock}
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-lg border border-gray-100 ${
        isOutOfStock ? 'opacity-70' : ''
      }`}
    >
      {/* Clickable image area */}
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 block">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {isOutOfStock && (
          <div className="absolute left-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 uppercase tracking-wider shadow-sm">
            Sold Out
          </div>
        )}
        {isLowStock && (
          <div className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider shadow-sm">
            Only {product.stockQuantity} left!
          </div>
        )}
        {product.discountActive && !isOutOfStock && (
          <div className="absolute right-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 uppercase tracking-wider shadow-sm">
            {product.discountRate}% Off
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <p className="text-[11px] text-gray-500 mb-1.5 uppercase tracking-widest font-semibold">{product.category}</p>
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2">
            <Link to={`/product/${product.id}`} className="hover:underline underline-offset-2">
              {product.name}
            </Link>
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} size={14} className={star <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} />
            ))}
            <span className="text-xs text-gray-500 ml-1">({product.rating})</span>
          </div>

          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xl font-bold text-gray-800">${displayPrice.toFixed(2)}</p>
              {product.discountActive ? (
                <p className="text-xs font-semibold text-gray-400 line-through">
                  ${product.price.toFixed(2)}
                </p>
              ) : null}
            </div>
            <span className={`text-xs font-medium ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stockQuantity} left` : `${product.stockQuantity} in Stock`}
            </span>
          </div>
        </div>

        <button
          data-testid="add-to-cart-btn"
          aria-label={isOutOfStock ? 'Out of stock' : `Add ${product.name} to cart`}
          onClick={() => {
            addToCart({
              id: product.id,
              name: product.name,
              price: displayPrice,
              imageUrl: product.imageUrl,
              stockQuantity: product.stockQuantity,
            });
          }}
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
