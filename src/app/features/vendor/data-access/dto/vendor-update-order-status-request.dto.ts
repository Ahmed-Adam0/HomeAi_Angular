export type VendorOrderStatusApi = 'Pending' | 'AwaitingCustomerApproval' | 'PendingPayment' | 'Confirmed' | 'InProgress' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface IVendorUpdateOrderStatusRequestDto {
  newStatus: VendorOrderStatusApi;
}
