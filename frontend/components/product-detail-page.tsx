'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';
import { readStoredSession, type StoredSession } from '../lib/session';

interface ProductRecord {
  id: string;
  _id?: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

const fallbackImage =
  'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1200&q=80';

export function ProductDetailPage({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductRecord[]>([]);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [selectedSize, setSelectedSize] = useState('42');
  const [selectedColor, setSelectedColor] = useState('Black');
  const [message, setMessage] = useState('Loading product.');

  useEffect(() => {
    setSession(readStoredSession());
    void loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const [productPayload, allProducts] = await Promise.all([
        apiRequest<ProductRecord>(`/products/${productId}`, { method: 'GET' }),
        apiRequest<ProductRecord[]>('/products', { method: 'GET' }),
      ]);

      setProduct(productPayload);
      setRelatedProducts(
        allProducts.filter((entry) => normalizeProductId(entry) !== normalizeId(productId)).slice(0, 4),
      );
      setMessage('Product ready.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Product could not be loaded');
    }
  }

  const galleryImage = useMemo(
    () => product?.imageUrl || fallbackImage,
    [product?.imageUrl],
  );

  async function addToCart() {
    const activeSession = readStoredSession();
    setSession(activeSession);

    if (!activeSession?.user?.id || !product) {
      setMessage('Please sign in before adding this item to your cart.');
      return;
    }

    try {
      await apiRequest('/cards', {
        method: 'POST',
        body: JSON.stringify({
          userId: activeSession.user.id,
          status: 'active',
          items: [
            {
              productId: normalizeProductId(product),
              quantity: Number(quantity),
              selectedSize,
              selectedColor,
            },
          ],
        }),
      });

      setMessage('Product added to cart.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Cart request failed');
    }
  }

  if (!product) {
    return (
      <div className="page-stack">
        <section className="message-strip">
          <strong>Product</strong>
          <span>{message}</span>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="breadcrumbs">HOME &gt; PRODUCT &gt; {product.name.toUpperCase()}</div>

      <section className="product-detail-shell">
        <div className="product-gallery">
          <div className="product-gallery-frame">
            <img src={galleryImage} alt={product.name} />
          </div>
        </div>

        <div className="product-summary">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <strong className="product-price">{formatCurrency(product.price)}</strong>
          <p className="product-body-copy">{product.description}</p>

          <div className="detail-fields">
            <label className="field">
              <span>Quantity</span>
              <input value={quantity} type="number" min="1" onChange={(event) => setQuantity(event.target.value)} />
            </label>
            <label className="field">
              <span>Size</span>
              <select value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
                <option>38</option>
                <option>39</option>
                <option>40</option>
                <option>41</option>
                <option>42</option>
                <option>43</option>
                <option>44</option>
              </select>
            </label>
            <label className="field">
              <span>Color</span>
              <select value={selectedColor} onChange={(event) => setSelectedColor(event.target.value)}>
                <option>Black</option>
                <option>White</option>
                <option>Stone</option>
                <option>Graphite</option>
              </select>
            </label>
          </div>

          <button type="button" className="primary-button detail-button" onClick={() => void addToCart()}>
            {session ? 'Add to cart' : 'Sign in to add to cart'}
          </button>

          <section className="message-strip is-plain detail-message">
            <strong>Status</strong>
            <span>{message}</span>
          </section>
        </div>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="related-strip">
          <div className="section-topline">
            <div>
              <p className="eyebrow">More products</p>
              <h2>Related picks</h2>
            </div>
          </div>

          <div className="product-grid related-grid">
            {relatedProducts.map((entry) => (
              <Link
                key={normalizeProductId(entry)}
                href={`/product/${normalizeProductId(entry)}`}
                className="product-card product-card-minimal"
              >
                <div className="product-image-wrap">
                  <img src={entry.imageUrl || fallbackImage} alt={entry.name} />
                </div>
                <div className="product-info">
                  <p>{entry.category}</p>
                  <h3>{entry.name}</h3>
                  <strong>{formatCurrency(entry.price)}</strong>
                  <span>{entry.stock} in stock</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function normalizeProductId(product: { id?: string; _id?: string }) {
  return String(product.id || product._id || '').trim();
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
