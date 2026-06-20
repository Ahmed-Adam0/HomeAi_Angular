import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

export const STATUS_API_MAP: Record<VendorOrderStatus, string> = {
  [VendorOrderStatus.Pending]: 'Pending',
  [VendorOrderStatus.Confirmed]: 'Confirmed',
  [VendorOrderStatus.Processing]: 'In Progress',
  [VendorOrderStatus.Ready]: 'Ready for Pickup',
  [VendorOrderStatus.Delivered]: 'Delivered',
  [VendorOrderStatus.Cancelled]: 'Cancelled',
};

export const STATUS_FRONTEND_MAP: Record<string, VendorOrderStatus> = {
  'Pending': VendorOrderStatus.Pending,
  'Confirmed': VendorOrderStatus.Confirmed,
  'Processing': VendorOrderStatus.Processing,
  'In Progress': VendorOrderStatus.Processing,
  'Shipped': VendorOrderStatus.Ready,
  'Ready for Pickup': VendorOrderStatus.Ready,
  'Delivered': VendorOrderStatus.Delivered,
  'Cancelled': VendorOrderStatus.Cancelled,
  'Accepted': VendorOrderStatus.Confirmed,
};
