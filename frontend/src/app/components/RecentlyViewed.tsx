import React from 'react';
import { Link } from 'react-router';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { LazyImage } from './LazyImage';

export const RecentlyViewed: React.FC = () => {
  const { recent } = useRecentlyViewed();

  if (recent.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <h2 className="text-xl font-bold text-gray-900 mb-5 tracking-tight">Recently viewed</h2>
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
        {recent.map((p) => (
          <Link
            key={p.id}
            to={`/product/${p.id}`}
            className="flex-shrink-0 w-40 snap-start group"
          >
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-2 shadow-sm group-hover:shadow-md transition-shadow">
              <LazyImage
                src={p.imageUrl}
                alt={p.name}
                className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <p className="text-xs font-bold text-gray-900 line-clamp-1">{p.name}</p>
            <p className="text-xs text-gray-500 tabular-nums">${p.price.toFixed(2)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
