import { VendorOrderStatus } from '../models/vendor-order-status.enum';
import { IStatusHistory, IOrder } from '../../orders/interfaces/iorder';

export interface IVendorOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  thumbnailUrl?: string;
}

export interface IVendorOrderCustomer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

export interface IVendorOrderShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface IVendorOrder {
  id: string;
  orderNumber: string;
  vendorId: string;
  customer: IVendorOrderCustomer;
  items: IVendorOrderItem[];
  status: VendorOrderStatus;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  shippingAddress: IVendorOrderShippingAddress;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  statusHistory: IStatusHistory | null;
  placedAt: string;
  updatedAt: string;
  estimatedDeliveryDate?: string;
}



export interface IVendorOrderSummary {
  id: string;
  orderNumber: string;
  customerName: string;
  status: VendorOrderStatus;
  totalAmount: number;
  currency: string;
  itemCount: number;
  placedAt: string;
}

export interface IVendorOrderStatusUpdate {
  orderId: string | number;
  status: VendorOrderStatus;
  note?: string;
}

export interface StatusUpdateResponse {
  message: string;
}

export interface IVendorOrdersPaginatedResponse {
  data: IOrder[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

