export interface IOrderItem {
  id: number;
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
  name?: string;
  total?: number;
  image?: string;
  snapshotBasePrice?: number;
  snapshotOptions?: {
    name: string;
    priceDelta: number;
  }[];
  finalUnitPrice?: number;
  totalItemPrice?: number;
  /** Localized immutable attribute snapshot from order API */
  attributes?: {
    nameAr: string;
    nameEn: string;
    valueAr: string;
    valueEn: string;
  }[];
}
