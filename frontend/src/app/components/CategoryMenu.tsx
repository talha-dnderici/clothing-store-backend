import React from 'react';

interface CategoryMenuProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = ['All', 'Men', 'Women', 'Shoes', 'Accessories', 'Unisex'];

export const CategoryMenu: React.FC<CategoryMenuProps> = ({ activeCategory, onCategoryChange }) => {
  return (
    <nav className="border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
          <ul className="flex gap-1 px-1">
            {categories.map((category) => (
              <li key={category}>
                <button
                  onClick={() => onCategoryChange(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-black text-white shadow-sm'
                      : 'text-gray-600 hover:text-black hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
