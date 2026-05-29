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
  workshopId: number;
  workshopNameAr: string;
  workshopNameEn: string;
  createdAt: string;
  mainImageUrl: string;
  averageRating?: number;
  totalReviews?: number;
}

export interface IProductResponse {
  items: IProduct[];
}
