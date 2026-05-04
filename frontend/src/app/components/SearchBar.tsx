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

  // Global "/" shortcut to focus search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleClear = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  return (
    <div
      className={`relative flex items-center rounded-full border bg-gray-50 transition-all duration-200 ${
        focused
          ? 'border-black shadow-lg shadow-black/5 ring-2 ring-black/10 bg-white'
          : 'border-gray-200 hover:border-gray-300 hover:bg-white'
      }`}
    >
      <Search size={18} className={`ml-4 flex-shrink-0 transition-colors ${focused ? 'text-black' : 'text-gray-400'}`} />
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
      {query ? (
        <button
          onClick={handleClear}
          className="mr-3 rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      ) : (
        <kbd className="mr-3 hidden md:inline-flex items-center rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-gray-400">
          /
        </kbd>
      )}
    </div>
  );
};
