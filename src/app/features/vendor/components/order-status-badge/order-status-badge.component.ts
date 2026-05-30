import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

type OrderStatusBadgeVariant = 'warning' | 'info' | 'primary' | 'success' | 'danger';

const STATUS_LABELS: Record<VendorOrderStatus, string> = {
  [VendorOrderStatus.Pending]: 'Pending',
  [VendorOrderStatus.Confirmed]: 'Confirmed',
  [VendorOrderStatus.Processing]: 'Processing',
  [VendorOrderStatus.Shipped]: 'Shipped',
  [VendorOrderStatus.Delivered]: 'Delivered',
  [VendorOrderStatus.Cancelled]: 'Cancelled',
};

const STATUS_VARIANTS: Record<VendorOrderStatus, OrderStatusBadgeVariant> = {
  [VendorOrderStatus.Pending]: 'warning',
  [VendorOrderStatus.Confirmed]: 'info',
  [VendorOrderStatus.Processing]: 'info',
  [VendorOrderStatus.Shipped]: 'primary',
  [VendorOrderStatus.Delivered]: 'success',
  [VendorOrderStatus.Cancelled]: 'danger',
};

@Component({
  selector: 'app-order-status-badge',
  standalone: true,
  templateUrl: './order-status-badge.component.html',
  styleUrl: './order-status-badge.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusBadge {
  readonly status = input.required<VendorOrderStatus>();

  readonly statusLabel = computed(() => STATUS_LABELS[this.status()]);

  readonly badgeClass = computed(
    () => `status-badge--${STATUS_VARIANTS[this.status()]}`
  );
}
