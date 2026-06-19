export interface IOrderItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
  productImage?: string;
  productNameEn?: string;
  productNameAr?: string;
  image?: string;
  id?: number;

  selectedColor?: string;
  selectedMaterial?: string;
  snapshotOptions?: {
    name: string;
    priceDelta: number;
  }[];
  snapshotBasePrice?: number;
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

