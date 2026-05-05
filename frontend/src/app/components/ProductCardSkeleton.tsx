import React from 'react';

export const ProductCardSkeleton: React.FC = () => (
  <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 animate-pulse">
    <div className="aspect-[4/5] w-full bg-gray-200" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-16 rounded bg-gray-200" />
      <div className="h-5 w-3/4 rounded bg-gray-200" />
      <div className="h-3 w-1/3 rounded bg-gray-200" />
      <div className="h-5 w-1/4 rounded bg-gray-200" />
      <div className="h-10 w-full rounded-xl bg-gray-200 mt-4" />
    </div>
  </div>
);
