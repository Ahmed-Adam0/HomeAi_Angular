export enum VendorOrderStatus {
  Accepted = 'Accepted',
  InProgress = 'In Progress',
  ReadyForPickup = 'Ready for Pickup',
  Delivered = 'Delivered',
  Cancelled = 'Cancelled',
}

export const ALLOWED_TRANSITIONS: Record<VendorOrderStatus, readonly VendorOrderStatus[]> = {
  [VendorOrderStatus.Accepted]: [VendorOrderStatus.InProgress, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.InProgress]: [VendorOrderStatus.ReadyForPickup, VendorOrderStatus.Cancelled],
  [VendorOrderStatus.ReadyForPickup]: [VendorOrderStatus.Delivered, VendorOrderStatus.Cancelled],
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
