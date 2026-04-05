export interface CategoryInterface {
  id: string;
  name: string;
  description: string;
  slug?: string;
  isActive?: boolean;
  parentCategoryId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}
