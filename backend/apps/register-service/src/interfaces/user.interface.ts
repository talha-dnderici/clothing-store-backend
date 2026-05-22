export interface UserInterface {
  id: string;
  name: string;
  email: string;
  taxId?: string;
  address?: string;
  isActive?: boolean;
  role: 'customer' | 'salesManager' | 'productManager';
  createdAt?: Date;
  updatedAt?: Date;
}
