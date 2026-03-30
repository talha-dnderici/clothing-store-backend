export interface CardItemInterface {
  productId: string;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface CardInterface {
  id: string;
  userId: string;
  items: CardItemInterface[];
  status: 'active' | 'ordered' | 'abandoned';
  createdAt?: Date;
  updatedAt?: Date;
}
