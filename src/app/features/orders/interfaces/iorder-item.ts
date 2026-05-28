export interface IOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  selectedMaterial?: string;
  subtotal: number;
  name?: string;
  total?: number;
  image?: string;
}
