export enum VendorOrderStatus {
  Pending = 'pending',
  AwaitingCustomerApproval = 'awaiting_customer_approval',
  Confirmed = 'confirmed',
  InProgress = 'in_progress',
  ReadyForPickup = 'ready_for_pickup',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export type OrderStatus = 'Pending' | 'AwaitingCustomerApproval' | 'Confirmed' | 'InProgress' | 'ReadyForPickup' | 'Delivered' | 'Cancelled';

export function mapToOrderStatusPayload(status: VendorOrderStatus): OrderStatus {
  switch (status) {
    case VendorOrderStatus.Pending:
      return 'Pending';
    case VendorOrderStatus.AwaitingCustomerApproval:
      return 'AwaitingCustomerApproval';
    case VendorOrderStatus.Confirmed:
      return 'Confirmed';
    case VendorOrderStatus.InProgress:
      return 'InProgress';
    case VendorOrderStatus.ReadyForPickup:
      return 'ReadyForPickup';
    case VendorOrderStatus.Delivered:
      return 'Delivered';
    case VendorOrderStatus.Cancelled:
      return 'Cancelled';
    default:
      return 'Pending';
  }
}

export const ALLOWED_TRANSITIONS: Record<VendorOrderStatus, readonly VendorOrderStatus[]> = {
  [VendorOrderStatus.Pending]: [VendorOrderStatus.AwaitingCustomerApproval, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.AwaitingCustomerApproval]: [VendorOrderStatus.Confirmed, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.Confirmed]: [VendorOrderStatus.InProgress, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.InProgress]: [VendorOrderStatus.ReadyForPickup],
  [VendorOrderStatus.ReadyForPickup]: [VendorOrderStatus.Delivered],
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
