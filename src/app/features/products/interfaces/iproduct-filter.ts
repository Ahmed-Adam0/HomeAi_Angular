export interface IProductFilter {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  materials?: string[];
  colors?: string[];
  minRating?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  inStockOnly?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popularity';
  page: number;
  limit: number;
}
