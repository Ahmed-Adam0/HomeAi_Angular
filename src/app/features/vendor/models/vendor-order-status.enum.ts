export enum VendorOrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Processing = 'processing',
  Ready = 'ready',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export function mapToOrderStatusPayload(status: VendorOrderStatus): OrderStatus {
  switch (status) {
    case VendorOrderStatus.Pending:
      return 'Pending';
    case VendorOrderStatus.Confirmed:
    case VendorOrderStatus.Processing:
      return 'Processing';
    case VendorOrderStatus.Ready:
      return 'Shipped';
    case VendorOrderStatus.Delivered:
      return 'Delivered';
    case VendorOrderStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Pending';
  }
}

export const ALLOWED_TRANSITIONS: Record<VendorOrderStatus, readonly VendorOrderStatus[]> = {
  [VendorOrderStatus.Pending]: [VendorOrderStatus.Confirmed, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.Confirmed]: [VendorOrderStatus.Processing, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.Processing]: [VendorOrderStatus.Ready],
  [VendorOrderStatus.Ready]: [VendorOrderStatus.Delivered],
  [VendorOrderStatus.Delivered]: [],
  [VendorOrderStatus.Cancelled]: [],
};

export function isValidTransition(
  current: VendorOrderStatus,
  next: VendorOrderStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[current];
  return allowed ? allowed.includes(next) : false;
}
