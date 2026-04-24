/**
 * FE-11 — UI test: Checkout form validation and invoice handoff.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router';
import Checkout from '../pages/Checkout';
import Invoice from '../pages/Invoice';
import { CartProvider, useCart } from '../context/CartContext';
import { AuthProvider, useAuth } from '../context/AuthContext';

const Seed = () => {
  const { addToCart } = useCart();
  const { login } = useAuth();
  React.useEffect(() => {
    login('jane@aura.test', 'Jane');
    addToCart({ id: 'a', name: 'Jacket', price: 100, imageUrl: '', stockQuantity: 3 }, 1);
  }, []);
  return null;
};

const RouteProbe = () => {
  const loc = useLocation();
  return <div data-testid="path">{loc.pathname}</div>;
};

const renderCheckout = () =>
  render(
    <MemoryRouter initialEntries={['/checkout']}>
      <AuthProvider>
        <CartProvider>
          <Seed />
          <RouteProbe />
          <Routes>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/invoice" element={<Invoice />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

const fill = (name: string, value: string) =>
  fireEvent.change(document.querySelector(`input[name="${name}"]`)!, {
    target: { value },
  });

describe('Checkout — FE-9 & FE-10', () => {
  it('blocks submission with invalid card', async () => {
    renderCheckout();
    await screen.findByTestId('checkout-page');
    fill('fullName', 'Jane Doe');
    fill('address', '1 Bosphorus St');
    fill('cardNumber', '1234');
    fill('expiry', '04/28');
    fill('cvc', '123');
    fireEvent.click(screen.getByTestId('pay-btn'));
    expect(await screen.findByTestId('checkout-error')).toHaveTextContent(/16 digits/i);
  });

  it('navigates to invoice after a valid mock payment', async () => {
    renderCheckout();
    await screen.findByTestId('checkout-page');
    fill('fullName', 'Jane Doe');
    fill('address', '1 Bosphorus St');
    fill('city', 'Istanbul');
    fill('postalCode', '34000');
    fill('cardNumber', '4242424242424242');
    fill('expiry', '04/28');
    fill('cvc', '123');
    fireEvent.click(screen.getByTestId('pay-btn'));

    await waitFor(
      () => expect(screen.getByTestId('invoice-page')).toBeInTheDocument(),
      { timeout: 2000 },
    );
    expect(screen.getByTestId('invoice-total')).toHaveTextContent(/100\.00/);
    expect(screen.getByTestId('invoice-order-id').textContent).toMatch(/MOCK-/);
  });
});
