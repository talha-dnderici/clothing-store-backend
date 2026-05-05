import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { CatalogProduct } from '../types/catalog';

const STORAGE_KEY = 'aura-recent';
const MAX_ITEMS = 8;

interface RecentlyViewedContextType {
  recent: CatalogProduct[];
  addRecent: (product: CatalogProduct) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<CatalogProduct[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    } catch {
      /* ignore */
    }
  }, [recent]);

  const addRecent = useCallback((product: CatalogProduct) => {
    setRecent((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recent, addRecent }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  const ctx = useContext(RecentlyViewedContext);
  if (!ctx) throw new Error('useRecentlyViewed must be used within RecentlyViewedProvider');
  return ctx;
}
