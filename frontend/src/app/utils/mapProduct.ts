/**
 * Maps raw backend product objects to the MockProduct shape used by the UI.
 * The backend may use _id (MongoDB) and slightly different field names,
 * so this adapter keeps the rest of the frontend consistent.
 */

import { MockProduct } from '../data/mockProducts';

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
}

export function mapProduct(raw: BackendProduct): MockProduct {
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
    category: raw.category || 'Uncategorized',
  };
}

export function mapProducts(rawList: BackendProduct[]): MockProduct[] {
  if (!Array.isArray(rawList)) return [];
  return rawList.map(mapProduct);
}
