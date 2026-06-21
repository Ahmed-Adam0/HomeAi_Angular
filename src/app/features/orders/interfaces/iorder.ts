import { IOrderItem } from './iorder-item';
import { IShippingAddress } from './ishipping-address';

export type OrderStatus = 'pending' | 'awaiting_customer_approval' | 'confirmed' | 'processing' | 'ready' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'completed';


export interface IStatusHistory {
  id: number;
  oldStatus: string;
  newStatus: string;
  createdAt: string;
}

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
  updatedAt: string | null;
  estimatedDeliveryDate?: string;
  placedAt?: string;
  estimatedDelivery?: string;
  subtotal?: number;
  total?: number;
  address: string;
  phoneNumber?: string;
  notes: string;
  statusHistory: IStatusHistory | null;
  masterOrderId?: number;
  customerName: string;
  customerPhone: string;
  itemCount?: number;
  vendorOrders?: ICustomerVendorOrder[];
}

/**
 * Backend Order API response for individual items.
 * Current API returns: id, productId, productName, quantity, unitPrice.
 * Does NOT return: productNameAr, productNameEn, or any image field.
 * Localized names and images are available via Products/{id} endpoint.
 */
export interface IBackendOrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  productImage?: string;
  /** Snapshot options stored at order time (legacy format) */
  snapshotBasePrice?: number;
  snapshotOptions?: {
    name: string;
    priceDelta: number;
  }[];
  finalUnitPrice?: number;
  totalItemPrice?: number;
  /** Immutable attribute snapshot returned by order API */
  attributes?: {
    nameAr: string;
    nameEn: string;
    valueAr: string;
    valueEn: string;
  }[];
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
  updatedAt?: string | null;
  estimatedDeliveryDate?: string;
  address?: string;
  phoneNumber?: string;
  notes?: string | null;
  statusHistory?: IStatusHistory | null;
  masterOrderId?: number;
  customerName?: string;
  customerPhone?: string;
  itemCount?: number;
  vendorOrders?: IBackendVendorOrder[];
}

export interface IBackendVendorOrder {
  id: number;
  status: string;
  estimatedDeliveryDate?: string;
  canApprove: boolean;
  totalPrice: number;
  items: IBackendOrderItem[];
}

export interface ICustomerVendorOrder {
  id: string;
  status: OrderStatus;
  estimatedDeliveryDate?: string;
  canApprove: boolean;
  totalPrice: number;
  items: IOrderItem[];
}


