import React from 'react';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { Link } from 'react-router';
import { CatalogProduct } from '../types/catalog';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

interface ProductCardProps {
  product: CatalogProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const displayPrice = product.effectivePrice ?? product.price;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = addToCart({
      id: product.id,
      name: product.name,
      price: displayPrice,
      imageUrl: product.imageUrl,
      stockQuantity: product.stockQuantity,
    });
    if (ok) {
      showToast({
        title: 'Added to cart',
        description: product.name,
        image: product.imageUrl,
        variant: 'success',
      });
    }
  };

  return (
    <div
      data-testid="product-card"
      data-out-of-stock={isOutOfStock ? 'true' : 'false'}
      aria-disabled={isOutOfStock}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 ${
        isOutOfStock ? 'opacity-70' : ''
      }`}
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/5] w-full overflow-hidden bg-gray-100 block">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
        />
        {/* Quick-view hint overlay */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
            <span className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-gray-900 shadow-lg">
              <Eye size={12} /> Quick view
            </span>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute left-3 top-3 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 uppercase tracking-wider shadow-sm">
            Sold Out
          </div>
        )}
        {isLowStock && (
          <div className="absolute left-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 uppercase tracking-wider shadow-sm animate-pulse">
            Only {product.stockQuantity} left!
          </div>
        )}
        {product.discountActive && !isOutOfStock && (
          <div className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider shadow-lg">
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
          onClick={handleAdd}
          disabled={isOutOfStock}
          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 active:scale-[0.97] ${
            isOutOfStock
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-black text-white hover:bg-gray-800 shadow-md hover:shadow-xl hover:shadow-black/20'
          }`}
        >
          <ShoppingCart size={18} />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};
