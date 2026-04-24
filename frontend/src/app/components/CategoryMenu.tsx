import React from 'react';

interface CategoryMenuProps {
  activeCategory: string;
  categories: string[];
  onCategoryChange: (category: string) => void;
}

export const CategoryMenu: React.FC<CategoryMenuProps> = ({
  activeCategory,
  categories,
  onCategoryChange,
}) => {
  return (
    <nav className="border-b border-gray-100 bg-white sticky top-16 z-40 backdrop-blur-md bg-white/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center overflow-x-auto whitespace-nowrap scrollbar-hide relative">
          <ul className="flex gap-1 px-1">
            {categories.map((category) => {
              const active = activeCategory === category;
              return (
                <li key={category} className="relative">
                  <button
                    onClick={() => onCategoryChange(category)}
                    className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
                      active
                        ? 'bg-black text-white shadow-md shadow-black/20'
                        : 'text-gray-600 hover:text-black hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
};
