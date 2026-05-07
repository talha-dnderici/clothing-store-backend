export interface CatalogProduct {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  description: string;
  stockQuantity: number;
  price: number;
  effectivePrice: number;
  discountRate: number;
  discountActive: boolean;
  warrantyStatus: string;
  distributor: string;
  imageUrl: string;
  rating: number;
  ratingCount: number;
  category: string;
  categories: string[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  description: string;
  slug?: string;
  isActive?: boolean;
  parentCategoryId?: string | null;
}
