import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import { api } from '../utils/api';

const STORAGE_KEY = 'aura-wishlist';

export type WishlistNotification = {
  id: string;
  type?: string;
  productId?: string;
  productName?: string;
  title: string;
  message?: string;
  isRead?: boolean;
  createdAt?: string;
  metadata?: {
    discountRate?: number;
    originalPrice?: number;
    discountedPrice?: number;
  };
};

type WishlistApiItem = {
  productId?: string;
  product?: { id?: string } | null;
};

type WishlistApiResponse = {
  items?: WishlistApiItem[];
};

interface WishlistContextType {
  wishlist: string[];
  notifications: WishlistNotification[];
  unreadCount: number;
  isSyncing: boolean;
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  refreshWishlist: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function readStoredWishlist() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem('token');
  } catch {
    return null;
  }
}

function idsFromWishlistResponse(data: WishlistApiResponse) {
  return (Array.isArray(data.items) ? data.items : [])
    .map((item) => item.productId || item.product?.id)
    .filter((id): id is string => Boolean(id));
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const [wishlist, setWishlist] = useState<string[]>(() => readStoredWishlist());
  const [notifications, setNotifications] = useState<WishlistNotification[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const token = user ? getStoredToken() : null;

  useEffect(() => {
    if (token) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      /* ignore */
    }
  }, [token, wishlist]);

  const refreshWishlist = useCallback(async () => {
    if (!token) {
      setWishlist(readStoredWishlist());
      return;
    }

    setIsSyncing(true);
    try {
      const res = await api.getWishlist(token);
      const nextWishlist = idsFromWishlistResponse(res.data as WishlistApiResponse);
      setWishlist(nextWishlist);
    } catch {
      setWishlist([]);
    } finally {
      setIsSyncing(false);
    }
  }, [token]);

  const refreshNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      const res = await api.getNotifications(token);
      setNotifications(Array.isArray(res.data) ? (res.data as WishlistNotification[]) : []);
    } catch {
      setNotifications([]);
    }
  }, [token]);

  useEffect(() => {
    refreshWishlist();
    refreshNotifications();
  }, [refreshNotifications, refreshWishlist]);

  const toggleWishlist = useCallback((id: string) => {
    const wasWishlisted = wishlist.includes(id);
    const previous = wishlist;
    const next = wasWishlisted ? wishlist.filter((x) => x !== id) : [...wishlist, id];
    setWishlist(next);

    if (!token) {
      return;
    }

    const sync = wasWishlisted ? api.removeWishlistItem(token, id) : api.addWishlistItem(token, id);
    sync
      .then((res) => {
        setWishlist(idsFromWishlistResponse(res.data as WishlistApiResponse));
        refreshNotifications();
      })
      .catch(() => {
        setWishlist(previous);
      });
  }, [refreshNotifications, token, wishlist]);

  const isWishlisted = useCallback((id: string) => wishlist.includes(id), [wishlist]);
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markNotificationRead = useCallback(async (id: string) => {
    if (!token) return;

    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification,
      ),
    );

    try {
      const res = await api.markNotificationRead(token, id);
      const updated = res.data as WishlistNotification;
      setNotifications((current) =>
        current.map((notification) => (notification.id === id ? updated : notification)),
      );
    } catch {
      setNotifications(previous);
    }
  }, [notifications, token]);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        notifications,
        unreadCount,
        isSyncing,
        toggleWishlist,
        isWishlisted,
        refreshWishlist,
        refreshNotifications,
        markNotificationRead,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
