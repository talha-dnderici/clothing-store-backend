import React from 'react';

const categories = ['New Arrivals', 'Men', 'Women', 'Shoes', 'Accessories', 'Sale'];

export const CategoryMenu = () => {
  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
          <ul className="flex gap-8 px-1">
            {categories.map((category) => (
              <li key={category}>
                <a
                  href={`#${category.toLowerCase().replace(' ', '-')}`}
                  className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                >
                  {category}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
