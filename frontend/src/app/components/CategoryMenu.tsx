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
  const GENDER_TERMS = ['All', 'Men', 'Women', 'Unisex'];
  
  const genders = categories.filter(c => GENDER_TERMS.includes(c));
  const types = categories.filter(c => !GENDER_TERMS.includes(c));

  const renderCategoryItem = (category: string, isPill = false) => {
    const active = activeCategory === category;
    
    const pillClass = `relative px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-95 ${
      active
        ? 'bg-black text-white shadow-md shadow-black/20'
        : 'text-gray-600 hover:text-black hover:bg-gray-100'
    }`;
    
    const plainClass = `relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 active:scale-95 ${
      active
        ? 'bg-gray-100 text-black shadow-sm'
        : 'text-gray-500 hover:text-black hover:bg-gray-50'
    }`;

    return (
      <li key={category} className="relative">
        <button
          onClick={() => onCategoryChange(category)}
          className={isPill ? pillClass : plainClass}
        >
          {category}
        </button>
      </li>
    );
  };

  return (
    <nav className="border-b border-gray-100 bg-white sticky top-16 z-40 backdrop-blur-md bg-white/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="flex h-14 items-center overflow-x-auto whitespace-nowrap scrollbar-hide">
            <div className="flex items-center gap-2">
              <ul className="flex gap-1 px-1">
                {genders.map((cat) => renderCategoryItem(cat, true))}
              </ul>
              
              {types.length > 0 && genders.length > 0 && (
                <div className="h-6 w-px bg-gray-300 mx-2" aria-hidden="true" />
              )}
              
              <ul className="flex gap-1 px-1">
                {types.map((cat) => renderCategoryItem(cat, false))}
              </ul>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent" />
        </div>
      </div>
    </nav>
  );
};
