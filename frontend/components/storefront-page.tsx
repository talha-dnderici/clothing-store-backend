'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../lib/api';

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

export function StorefrontPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const payload = await apiRequest<ProductRecord[]>('/products', { method: 'GET' });
      setProducts(payload);
    } catch {
      setProducts([]);
    }
  }

  const featuredProducts = useMemo(() => products.slice(0, 12), [products]);

  return (
    <div className="page-stack">
      <div className="store-intro">
        <div className="breadcrumbs">HOME &gt; NEW SEASON</div>
      </div>

      <section className="catalog-section catalog-section-minimal">
        <div className="product-grid product-grid-minimal">
          {featuredProducts.map((product) => (
            <Link
              key={normalizeProductId(product)}
              href={`/product/${normalizeProductId(product)}`}
              className="product-card product-card-minimal"
            >
              <div className="product-image-wrap">
                <img src={product.imageUrl || fallbackImage} alt={product.name} />
              </div>
              <div className="product-info">
                <p>{product.category}</p>
                <h3>{product.name}</h3>
                <strong>{formatCurrency(product.price)}</strong>
                <span>{product.stock} in stock</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function normalizeProductId(product: { id?: string; _id?: string }) {
  return String(product.id || product._id || '').trim();
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(value);
}
