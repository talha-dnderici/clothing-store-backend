export interface CatalogProduct {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  stockQuantity: number;
  price: number;
  warrantyStatus: string;
  distributor: string;
  imageUrl: string;
  rating: number;
  category: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  slug?: string;
  isActive?: boolean;
  parentCategoryId?: string | null;
}
