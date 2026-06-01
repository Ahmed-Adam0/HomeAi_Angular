export type VendorOrderStatusApi = 'Pending' | 'Confirmed' | 'In Progress' | 'Ready for Pickup' | 'Delivered' | 'Cancelled';

export interface IVendorUpdateOrderStatusRequestDto {
  newStatus: VendorOrderStatusApi;
}
