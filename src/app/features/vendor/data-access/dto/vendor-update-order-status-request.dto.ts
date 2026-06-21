export type VendorOrderStatusApi = 'Pending' | 'AwaitingCustomerApproval' | 'Confirmed' | 'InProgress' | 'ReadyForPickup' | 'Delivered' | 'Cancelled';

export interface IVendorUpdateOrderStatusRequestDto {
  newStatus: VendorOrderStatusApi;
}
