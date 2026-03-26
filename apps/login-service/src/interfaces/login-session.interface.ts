export interface LoginSessionInterface {
  id: string;
  userId: string;
  email: string;
  token: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
