export interface IVendorOrderDashboardDto {
  id: number;
  customerName: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  updatedAt?: string | null;
  itemCount: number;
  customerPhone: string;
  address: string;
}
