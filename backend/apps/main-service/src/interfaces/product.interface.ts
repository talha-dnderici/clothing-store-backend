export interface ProductInterface {
  id: string;
  name: string;
  model?: string;
  serialNumber?: string;
  description: string;
  categoryId: string;
  categoryIds: string[];
  price: number;
  stock: number;
  warrantyStatus?: boolean;
  distributor?: string;
  discountRate?: number;
  popularity?: number;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
