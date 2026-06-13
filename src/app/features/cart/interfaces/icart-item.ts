export interface ICartItem {
  id: string;
  productId: string;
  cartItemId?: string;
  productName: string;
  productNameEn?: string;
  productNameAr?: string;
  productImage: string;
  images?: string[];
  price: number;
  quantity: number;
  selectedColor?: string;
  selectedMaterial?: string;
  subtotal: number;
}
