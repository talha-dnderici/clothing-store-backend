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
  warrantyStatus?: string;
  distributor?: string;
  imageUrl?: string;
  rating?: number;
  category?: string;
  categoryName?: string;
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
    warrantyStatus: raw.warrantyStatus || 'Not Available',
    distributor: raw.distributor || 'Unknown',
    imageUrl: raw.imageUrl || 'https://via.placeholder.com/400',
    rating: raw.rating ?? 4.0,
    category: raw.categoryName || raw.category || 'Uncategorized',
  };
}

export function mapProducts(rawList: BackendProduct[]): CatalogProduct[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapProduct);
}
