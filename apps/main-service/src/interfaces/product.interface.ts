export interface ProductInterface {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
