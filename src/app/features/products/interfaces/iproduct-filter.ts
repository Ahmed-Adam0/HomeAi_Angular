export interface IProductFilter {
  query?: string;
  categoryId?: string;
  subCategoryId?: string | null;
  vendorId?: string | null;
  materialOptionIds?: number[];
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
