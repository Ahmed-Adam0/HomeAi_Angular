export interface IFavoriteItem {
  id: string; // favorite record id
  productId: string;
  productName: string;
  productNameEn?: string;
  productNameAr?: string;
  productImage: string;
  price: number;
  salePrice?: number;
  addedAt: string;
  inStock: boolean;
}

