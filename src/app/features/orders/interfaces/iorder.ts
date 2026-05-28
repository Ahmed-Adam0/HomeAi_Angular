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
  placedAt?: string;
  estimatedDelivery?: string;
  subtotal?: number;
  total?: number;
  address?: string;
  phoneNumber?: string;
  notes: string | null;
  statusHistory: IOrderStatusHistory[];
}

export interface IBackendOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface IOrderStatusHistory {
  id: number;
  oldStatus: string;
  newStatus: string;
  createdAt: string;
}

export interface IBackendOrder {
  id: number;
  userId: string;
  totalPrice: number;
  status: string; // E.g. 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
  createdAt: string;
  items: IBackendOrderItem[];
  shippingAddress?: IShippingAddress;
  billingAddress?: IShippingAddress;
  shippingCost?: number;
  taxAmount?: number;
  discountAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  trackingNumber?: string;
  carrier?: string;
  updatedAt?: string;
  estimatedDeliveryDate?: string;
  address?: string;
  phoneNumber?: string;
  notes?: string | null;
  statusHistory?: IOrderStatusHistory[];
}

