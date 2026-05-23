export interface ICategory {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  slug: string;
  parentCategoryId?: string;
  productCount: number;
}
