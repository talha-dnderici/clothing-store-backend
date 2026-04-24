/**
 * FE-11 — UI test: Out-of-stock product card.
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { CartProvider, useCart } from '../context/CartContext';
import type { CatalogProduct } from '../types/catalog';

const wrap = (ui: React.ReactNode) => (
  <MemoryRouter>
    <CartProvider>{ui}</CartProvider>
  </MemoryRouter>
);

const baseProduct: CatalogProduct = {
  id: 'p1',
  name: 'Test Shirt',
  description: '',
  price: 50,
  effectivePrice: 50,
  discountActive: false,
  discountRate: 0,
  stockQuantity: 10,
  imageUrl: '',
  category: 'Tops',
  rating: 4,
} as unknown as CatalogProduct;

describe('ProductCard — FE-4', () => {
  it('disables Add to Cart when stock is 0', () => {
    render(wrap(<ProductCard product={{ ...baseProduct, stockQuantity: 0 }} />));
    const btn = screen.getByTestId('add-to-cart-btn');
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent(/out of stock/i);
    expect(screen.getByTestId('product-card')).toHaveAttribute('data-out-of-stock', 'true');
  });

  it('enables Add to Cart when stock > 0', () => {
    render(wrap(<ProductCard product={baseProduct} />));
    const btn = screen.getByTestId('add-to-cart-btn');
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    // button still present and not throwing
    expect(btn).toBeInTheDocument();
  });
});

describe('CartContext', () => {
  it('does not exceed stock when adding', () => {
    let api: ReturnType<typeof useCart> | null = null;
    const Probe = () => {
      api = useCart();
      return null;
    };
    render(wrap(<Probe />));
    api!.addToCart({ id: 'x', name: 'x', price: 1, imageUrl: '', stockQuantity: 2 }, 5);
    // 5 > 2 → should be ignored
    expect(api!.items.find((i) => i.id === 'x')).toBeUndefined();
    api!.addToCart({ id: 'x', name: 'x', price: 1, imageUrl: '', stockQuantity: 2 }, 2);
    expect(api!.items[0].quantity).toBe(2);
  });
});
