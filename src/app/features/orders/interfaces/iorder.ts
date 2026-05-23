import { IOrderItem } from './iorder-item';
import { IShippingAddress } from './ishipping-address';

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface IOrder {
  id: string;
  orderNumber: string;
  userId: string;
  items: IOrderItem[];
  status: OrderStatus;
  shippingAddress: IShippingAddress;
  billingAddress: IShippingAddress;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryDate?: string;
}
