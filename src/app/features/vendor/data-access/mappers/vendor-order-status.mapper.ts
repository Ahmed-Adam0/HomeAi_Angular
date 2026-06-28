import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

export const STATUS_API_MAP: Record<VendorOrderStatus, string> = {
  [VendorOrderStatus.Pending]: 'Pending',
  [VendorOrderStatus.AwaitingCustomerApproval]: 'AwaitingCustomerApproval',
  [VendorOrderStatus.PendingPayment]: 'PendingPayment',
  [VendorOrderStatus.Confirmed]: 'Confirmed',
  [VendorOrderStatus.InProgress]: 'InProgress',
  [VendorOrderStatus.Shipped]: 'Shipped',
  [VendorOrderStatus.Delivered]: 'Delivered',
  [VendorOrderStatus.Cancelled]: 'Cancelled',
};

export const STATUS_FRONTEND_MAP: Record<string, VendorOrderStatus> = {
  'Pending': VendorOrderStatus.Pending,
  'AwaitingCustomerApproval': VendorOrderStatus.AwaitingCustomerApproval,
  'PendingPayment': VendorOrderStatus.PendingPayment,
  'Confirmed': VendorOrderStatus.Confirmed,
  'InProgress': VendorOrderStatus.InProgress,
  'Shipped': VendorOrderStatus.Shipped,
  'Delivered': VendorOrderStatus.Delivered,
  'Cancelled': VendorOrderStatus.Cancelled,
  
  // Legacy & variants support:
  'pending': VendorOrderStatus.Pending,
  'awaitingcustomerapproval': VendorOrderStatus.AwaitingCustomerApproval,
  'awaiting_customer_approval': VendorOrderStatus.AwaitingCustomerApproval,
  'pendingpayment': VendorOrderStatus.PendingPayment,
  'pending_payment': VendorOrderStatus.PendingPayment,
  'confirmed': VendorOrderStatus.Confirmed,
  'inprogress': VendorOrderStatus.InProgress,
  'in_progress': VendorOrderStatus.InProgress,
  'shipped': VendorOrderStatus.Shipped,
  'delivered': VendorOrderStatus.Delivered,
  'cancelled': VendorOrderStatus.Cancelled,
  'Processing': VendorOrderStatus.InProgress,
  'In Progress': VendorOrderStatus.InProgress,
  'Ready for Pickup': VendorOrderStatus.Shipped,
  'Accepted': VendorOrderStatus.Confirmed,
};
