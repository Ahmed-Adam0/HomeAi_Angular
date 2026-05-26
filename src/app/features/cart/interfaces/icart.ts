import { ICartItem } from './icart-item';

export interface ICart {
  items: ICartItem[];
  totalQuantity: number;
  totalPrice: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  promoCode?: string;
}
