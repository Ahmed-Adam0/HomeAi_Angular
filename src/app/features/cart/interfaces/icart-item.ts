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
  /** Live price from backend (may differ from cachedPrice if vendor updated) */
  livePrice?: number;
  /** True when backend live price differs from the cached price */
  isPriceStale?: boolean;
  quantity: number;
  selectedColor?: string;
  selectedMaterial?: string;
  subtotal: number;
  selectedOptionIds?: number[];
  /** Localized selected attribute labels returned by backend */
  options?: {
    name: string;
    nameAr?: string;
    nameEn?: string;
    priceDelta: number;
  }[];
  vendorNameEn?: string;
  vendorNameAr?: string;
}
