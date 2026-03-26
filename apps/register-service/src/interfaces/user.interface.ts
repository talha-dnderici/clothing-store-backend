export interface UserInterface {
  id: string;
  name: string;
  email: string;
  taxId?: string;
  address?: string;
  role: 'customer' | 'salesManager' | 'productManager';
  createdAt?: Date;
  updatedAt?: Date;
}
