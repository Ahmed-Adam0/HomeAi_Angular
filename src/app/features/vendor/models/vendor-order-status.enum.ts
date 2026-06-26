export enum VendorOrderStatus {
  Pending = 'pending',
  AwaitingCustomerApproval = 'awaiting_customer_approval',
  PendingPayment = 'pending_payment',
  Confirmed = 'confirmed',
  InProgress = 'in_progress',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export type OrderStatus = 'Pending' | 'AwaitingCustomerApproval' | 'PendingPayment' | 'Confirmed' | 'InProgress' | 'Shipped' | 'Delivered' | 'Cancelled';

export function mapToOrderStatusPayload(status: VendorOrderStatus): OrderStatus {
  switch (status) {
    case VendorOrderStatus.Pending:
      return 'Pending';
    case VendorOrderStatus.AwaitingCustomerApproval:
      return 'AwaitingCustomerApproval';
    case VendorOrderStatus.PendingPayment:
      return 'PendingPayment';
    case VendorOrderStatus.Confirmed:
      return 'Confirmed';
    case VendorOrderStatus.InProgress:
      return 'InProgress';
    case VendorOrderStatus.Shipped:
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
  [VendorOrderStatus.Pending]: [VendorOrderStatus.AwaitingCustomerApproval, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.AwaitingCustomerApproval]: [VendorOrderStatus.PendingPayment, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.PendingPayment]: [VendorOrderStatus.Confirmed],
  [VendorOrderStatus.Confirmed]: [VendorOrderStatus.InProgress],
  [VendorOrderStatus.InProgress]: [VendorOrderStatus.Shipped],
  [VendorOrderStatus.Shipped]: [VendorOrderStatus.Delivered],
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
