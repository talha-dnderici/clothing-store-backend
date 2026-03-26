'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';
import { readStoredSession } from '../lib/session';

interface ProductRecord {
  id: string;
  _id?: string;
  name: string;
  price: number;
  imageUrl?: string;
}

interface CardRecord {
  id: string;
  userId: string;
  status: string;
  items: Array<{
    productId: string;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
  }>;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80';

export function CartPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [message, setMessage] = useState('Loading cart summary.');

  useEffect(() => {
    void loadCart();
  }, []);

  async function loadCart() {
    const session = readStoredSession();

    if (!session?.user?.id) {
      setMessage('Login required to display the cart.');
      setCards([]);
      return;
    }

    try {
      const [allProducts, allCards] = await Promise.all([
        apiRequest<ProductRecord[]>('/products', { method: 'GET' }),
        apiRequest<CardRecord[]>('/cards', { method: 'GET' }),
      ]);

      setProducts(allProducts);
      setCards(allCards.filter((card) => normalizeId(card.userId) === normalizeId(session.user.id)));
      setMessage('Cart loaded successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cart could not be loaded');
    }
  }

  async function removeCard(cardId: string) {
    try {
      await apiRequest(`/cards/${cardId}`, { method: 'DELETE' });
      await loadCart();
      setMessage('Cart item removed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Delete failed');
    }
  }

  const items = useMemo(
    () =>
      cards.flatMap((card) =>
        card.items.map((item) => {
          const normalizedProductId = normalizeId(item.productId);
          const product = products.find(
            (entry) =>
              normalizeId(entry.id) === normalizedProductId ||
              normalizeId(entry._id || '') === normalizedProductId,
          );

          return {
            cardId: card.id,
            productName: product?.name || 'Selected product',
            productPrice: product?.price || 0,
            imageUrl: product?.imageUrl || fallbackImage,
            quantity: item.quantity,
            selectedSize: item.selectedSize || '-',
            selectedColor: item.selectedColor || '-',
          };
        }),
      ),
    [cards, products],
  );

  const subtotal = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  return (
    <div className="page-stack">
      <section className="cart-shell">
        <div className="cart-main">
          <div className="section-topline">
            <div>
              <p className="eyebrow">My Cart</p>
              <h2>My Cart ({items.length} items)</h2>
            </div>
          </div>

          <div className="message-strip is-plain">
            <strong>Cart</strong>
            <span>{message}</span>
          </div>

          <div className="cart-list">
            {items.length === 0 ? (
              <div className="content-card cart-empty">
                <h3>Your cart is empty.</h3>
                <p>Products added from the detail page will appear here as real cart items.</p>
              </div>
            ) : (
              items.map((item) => (
                <article key={`${item.cardId}-${item.productName}-${item.selectedSize}`} className="cart-item">
                  <img src={item.imageUrl} alt={item.productName} />
                  <div className="cart-item-copy">
                    <h3>{item.productName}</h3>
                    <p>Color: {item.selectedColor}</p>
                    <p>Size: {item.selectedSize}</p>
                    <p>Quantity: {item.quantity}</p>
                    <strong>{formatCurrency(item.productPrice * item.quantity)}</strong>
                  </div>
                  <button type="button" className="text-button" onClick={() => void removeCard(item.cardId)}>
                    Remove
                  </button>
                </article>
              ))
            )}
          </div>
        </div>

        <aside className="order-summary">
          <div className="section-topline">
            <div>
              <p className="eyebrow">Order Summary</p>
              <h2>Total</h2>
            </div>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
          <div className="summary-row">
            <span>Shipping</span>
            <strong>Free</strong>
          </div>
          <div className="summary-row summary-total">
            <span>Grand total</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>

          <button type="button" className="primary-button summary-button">
            Confirm cart
          </button>
        </aside>
      </section>
    </div>
  );
}

function normalizeId(value: string) {
  return String(value || '').trim();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(value);
}
