import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      onSearch(query);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative flex items-center rounded-full border bg-gray-50 transition-all duration-200 ${
        focused ? 'border-black shadow-sm ring-1 ring-black bg-white' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <Search size={18} className="ml-4 text-gray-400 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search products..."
        className="flex-1 bg-transparent py-2.5 pl-3 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      {query && (
        <button
          onClick={handleClear}
          className="mr-3 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
