export interface IProduct {
  id: number;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  categoryId: number;
  categoryNameAr: string;
  categoryNameEn: string;
  subCategoryId?: number;
  subCategoryNameAr?: string;
  subCategoryNameEn?: string;
  productTypeId?: number;
  productTypeNameAr?: string;
  productTypeNameEn?: string;
  workshopId: number;
  workshopNameAr: string;
  workshopNameEn: string;
  workshopLogoUrl?: string;
  workshopRating?: number;
  workshopIsVerified?: boolean;
  createdAt: string;
  mainImageUrl: string;
  sku?: string;
  tags?: string[];
  averageRating?: number;
  totalReviews?: number;
  isActive?: boolean;
  status?: string;
  discountPercentage?: number;
  basePrice?: number;
  imageUrl?: string;
  materials?: {
    materialId: number;
    name: string;
    nameAr?: string;
    nameEn?: string;
    options: {
      id: number;
      name: string;
      valueAr?: string;
      valueEn?: string;
      priceDelta: number;
    }[];
  }[];
  materialGroups?: {
    materialId: number;
    name: string;
    nameAr?: string;
    nameEn?: string;
    options: {
      id: number;
      name: string;
      valueAr?: string;
      valueEn?: string;
      priceDelta: number;
    }[];
  }[];
  images?: IProductImage[];
  vendorMaterialOptionIds?: number[];
  attributes?: {
    id: number;
    name?: string;
    nameAr?: string;
    nameEn?: string;
    values: {
      id: number;
      valueAr?: string;
      valueEn?: string;
      priceDelta: number;
    }[];
  }[];
  product3DModelUrl?: string | null;
}

export interface IProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface IProductResponse {
  items: IProduct[];
}
