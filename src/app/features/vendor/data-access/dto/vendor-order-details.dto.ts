export interface IVendorOrderItemDto {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface IVendorOrderStatusHistoryDto {
  id: number;
  oldStatus: string;
  newStatus: string;
  createdAt: string;
}

export interface IVendorOrderDetailsDto {
  id: number;
  userId: string;
  customerName: string;
  customerPhone: string;
  totalPrice: number;
  status: string;
  address: string;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  items: IVendorOrderItemDto[];
  statusHistory: IVendorOrderStatusHistoryDto | null;
}

