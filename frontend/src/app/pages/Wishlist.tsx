import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router';
import { useWishlist } from '../context/WishlistContext';
import { api } from '../utils/api';
import { mapProduct } from '../utils/mapProduct';
import { CatalogProduct } from '../types/catalog';
import { ProductCard } from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/ProductCardSkeleton';
import { EmptyState } from '../components/EmptyState';

export default function Wishlist() {
  const { wishlist } = useWishlist();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (wishlist.length === 0) {
      setProducts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    Promise.all(
      wishlist.map((id) =>
        api.getProduct(id)
          .then((res) => mapProduct(res.data))
          .catch(() => null)
      )
    ).then((results) => {
      if (!cancelled) {
        setProducts(results.filter((p): p is CatalogProduct => p !== null));
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [wishlist]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-8 flex items-center gap-3">
        <Heart className="text-red-500" fill="currentColor" size={28} /> Your Wishlist
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Heart size={36} className="text-gray-400" />}
          title="Your wishlist is empty"
          description="Save items you love and they'll show up here."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link to="/" className="text-sm font-semibold text-gray-600 hover:text-black underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
