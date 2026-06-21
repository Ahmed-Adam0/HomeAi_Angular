import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

export const STATUS_API_MAP: Record<VendorOrderStatus, string> = {
  [VendorOrderStatus.Pending]: 'Pending',
  [VendorOrderStatus.AwaitingCustomerApproval]: 'AwaitingCustomerApproval',
  [VendorOrderStatus.Confirmed]: 'Confirmed',
  [VendorOrderStatus.InProgress]: 'InProgress',
  [VendorOrderStatus.ReadyForPickup]: 'ReadyForPickup',
  [VendorOrderStatus.Delivered]: 'Delivered',
  [VendorOrderStatus.Cancelled]: 'Cancelled',
};

export const STATUS_FRONTEND_MAP: Record<string, VendorOrderStatus> = {
  'Pending': VendorOrderStatus.Pending,
  'AwaitingCustomerApproval': VendorOrderStatus.AwaitingCustomerApproval,
  'Confirmed': VendorOrderStatus.Confirmed,
  'InProgress': VendorOrderStatus.InProgress,
  'ReadyForPickup': VendorOrderStatus.ReadyForPickup,
  'Delivered': VendorOrderStatus.Delivered,
  'Cancelled': VendorOrderStatus.Cancelled,
  
  // Legacy & variants support:
  'pending': VendorOrderStatus.Pending,
  'awaitingcustomerapproval': VendorOrderStatus.AwaitingCustomerApproval,
  'awaiting_customer_approval': VendorOrderStatus.AwaitingCustomerApproval,
  'confirmed': VendorOrderStatus.Confirmed,
  'inprogress': VendorOrderStatus.InProgress,
  'in_progress': VendorOrderStatus.InProgress,
  'readyforpickup': VendorOrderStatus.ReadyForPickup,
  'ready_for_pickup': VendorOrderStatus.ReadyForPickup,
  'delivered': VendorOrderStatus.Delivered,
  'cancelled': VendorOrderStatus.Cancelled,
  'Processing': VendorOrderStatus.InProgress,
  'In Progress': VendorOrderStatus.InProgress,
  'Shipped': VendorOrderStatus.ReadyForPickup,
  'Ready for Pickup': VendorOrderStatus.ReadyForPickup,
  'Accepted': VendorOrderStatus.Confirmed,
};
