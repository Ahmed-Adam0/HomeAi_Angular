export interface ICartItem {
  id: string;
  productId: string;
  productName: string;
  productNameEn?: string;
  productNameAr?: string;
  productImage: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  selectedMaterial?: string;
  subtotal: number;
}
