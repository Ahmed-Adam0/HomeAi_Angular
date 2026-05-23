export interface IFavoriteItem {
  id: string; // favorite record id
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  salePrice?: number;
  addedAt: string;
  inStock: boolean;
}
