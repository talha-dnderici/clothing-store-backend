/**
 * FE-11 — UI test: Cart page guest-login redirection.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import Cart from '../pages/Cart';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

const Seeder: React.FC<{ login?: boolean }> = ({ login }) => {
  const { addToCart } = useCart();
  const { login: doLogin } = useAuth();
  React.useEffect(() => {
    addToCart(
      { id: 'i1', name: 'Tee', price: 20, imageUrl: '', stockQuantity: 5 },
      2,
    );
    if (login) doLogin('jane@aura.test', 'Jane');
  }, []);
  return null;
};

const renderCart = (login = false) =>
  render(
    <MemoryRouter initialEntries={['/cart']}>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Seeder login={login} />
            <Routes>
              <Route path="/cart" element={<Cart />} />
              <Route path="/auth" element={<div data-testid="auth-page" />} />
              <Route path="/checkout" element={<div data-testid="checkout-page-stub" />} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

describe('Cart — FE-8', () => {
  it('redirects guests to /auth when attempting checkout', async () => {
    renderCart(false);
    fireEvent.click(await screen.findByTestId('checkout-btn'));
    expect(await screen.findByTestId('auth-page')).toBeInTheDocument();
  });

  it('goes to /checkout for logged-in users', async () => {
    renderCart(true);
    fireEvent.click(await screen.findByTestId('checkout-btn'));
    expect(await screen.findByTestId('checkout-page-stub')).toBeInTheDocument();
  });

  it('shows computed subtotal', async () => {
    renderCart(false);
    expect((await screen.findByTestId('cart-subtotal')).textContent).toMatch(/40\.00/);
  });
});
