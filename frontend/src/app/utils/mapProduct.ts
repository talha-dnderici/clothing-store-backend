/**
 * Maps raw backend product objects to the catalog product shape used by the UI.
 * The backend may use _id (MongoDB) and slightly different field names,
 * so this adapter keeps the rest of the frontend consistent.
 */

import { CatalogProduct } from '../types/catalog';

// Shape coming from the NestJS backend
interface BackendProduct {
  _id?: string;
  id?: string;
  name: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  stock?: number;
  stockQuantity?: number;
  price: number;
  effectivePrice?: number;
  discountRate?: number;
  discountActive?: boolean;
  warrantyStatus?: string;
  distributor?: string;
  imageUrl?: string;
  rating?: number;
  ratingAverage?: number;
  ratingCount?: number;
  category?: string;
  categoryName?: string;
  categories?: Array<{ id?: string; name?: string; slug?: string } | string>;
}

export function mapProduct(raw: BackendProduct): CatalogProduct {
  return {
    id: raw._id || raw.id || '',
    name: raw.name || 'Unnamed Product',
    model: raw.model || '',
    serialNumber: raw.serialNumber || '',
    description: raw.description || '',
    stockQuantity: raw.stockQuantity ?? raw.stock ?? 0,
    price: raw.price ?? 0,
    effectivePrice: raw.effectivePrice ?? raw.price ?? 0,
    discountRate: raw.discountRate ?? 0,
    discountActive: Boolean(raw.discountActive),
    warrantyStatus: raw.warrantyStatus || 'Not Available',
    distributor: raw.distributor || 'Unknown',
    imageUrl: raw.imageUrl || 'https://via.placeholder.com/400',
    rating: raw.ratingAverage ?? raw.rating ?? 0,
    ratingCount: raw.ratingCount ?? 0,
    category: raw.categoryName || raw.category || 'Uncategorized',
    categories: Array.isArray(raw.categories)
      ? raw.categories
          .map((c) => (typeof c === 'string' ? c : c?.name ?? ''))
          .filter(Boolean)
      : [raw.categoryName || raw.category || ''].filter(Boolean),
  };
}

export function mapProducts(rawList: BackendProduct[]): CatalogProduct[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapProduct);
}
