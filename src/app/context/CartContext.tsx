import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ── Types ────────────────────────────────────
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  maxStock: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: { id: string; name: string; price: number; imageUrl: string; stockQuantity: number }, qty?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, qty: number) => boolean;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  lastAction: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ── Provider ─────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const addToCart = useCallback((product: { id: string; name: string; price: number; imageUrl: string; stockQuantity: number }, qty = 1): boolean => {
    let success = false;

    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      const currentQty = existing ? existing.quantity : 0;

      if (currentQty + qty > product.stockQuantity) {
        // Would exceed stock
        success = false;
        return prev;
      }

      success = true;

      if (existing) {
        return prev.map(i =>
          i.productId === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }

      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: qty,
        maxStock: product.stockQuantity,
      }];
    });

    if (success) {
      setLastAction(`${product.name} added to cart`);
      setTimeout(() => setLastAction(null), 3000);
    }

    return success;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, qty: number): boolean => {
    if (qty < 1) {
      removeFromCart(productId);
      return true;
    }

    let success = false;

    setItems(prev => prev.map(i => {
      if (i.productId === productId) {
        if (qty > i.maxStock) {
          success = false;
          return i;
        }
        success = true;
        return { ...i, quantity: qty };
      }
      return i;
    }));

    return success;
  }, [removeFromCart]);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, lastAction }}>
      {children}
    </CartContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
