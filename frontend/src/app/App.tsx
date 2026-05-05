import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { WishlistProvider } from './context/WishlistContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <RouterProvider router={router} />
            </RecentlyViewedProvider>
          </WishlistProvider>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
