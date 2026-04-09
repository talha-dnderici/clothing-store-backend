import { MockProduct } from '../data/mockProducts';

/**
 * Maps backend snake_case product to frontend camelCase MockProduct.
 * When the real PostgreSQL backend is ready, this is the single
 * place to update if the schema changes.
 */
export function mapProduct(raw: any): MockProduct {
  return {
    id: String(raw.id),
    name: raw.name,
    model: raw.model,
    serialNumber: raw.serial_number ?? raw.serialNumber ?? '',
    description: raw.description,
    stockQuantity: raw.quantity_in_stock ?? raw.stockQuantity ?? 0,
    price: Number(raw.price),
    warrantyStatus: raw.warranty_status ?? raw.warrantyStatus ?? '',
    distributor: raw.distributor_information ?? raw.distributor ?? '',
    imageUrl: raw.image_url ?? raw.imageUrl ?? '',
    rating: Number(raw.rating),
    category: raw.category ?? '',
  };
}

export function mapProducts(rawList: any[]): MockProduct[] {
  return rawList.map(mapProduct);
}
