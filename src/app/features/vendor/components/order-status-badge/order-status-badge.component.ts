import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

type OrderStatusBadgeVariant = 'warning' | 'info' | 'primary' | 'success' | 'danger';

const STATUS_KEYS: Record<VendorOrderStatus, string> = {
  [VendorOrderStatus.Pending]: 'VENDOR.STATUS.PENDING',
  [VendorOrderStatus.AwaitingCustomerApproval]: 'VENDOR.STATUS.AWAITING_CUSTOMER_APPROVAL',
  [VendorOrderStatus.PendingPayment]: 'VENDOR.STATUS.PENDING_PAYMENT',
  [VendorOrderStatus.Confirmed]: 'VENDOR.STATUS.CONFIRMED',
  [VendorOrderStatus.InProgress]: 'VENDOR.STATUS.IN_PROGRESS',
  [VendorOrderStatus.Shipped]: 'VENDOR.STATUS.SHIPPED',
  [VendorOrderStatus.Delivered]: 'VENDOR.STATUS.DELIVERED',
  [VendorOrderStatus.Cancelled]: 'VENDOR.STATUS.CANCELLED',
};

const STATUS_VARIANTS: Record<VendorOrderStatus, OrderStatusBadgeVariant> = {
  [VendorOrderStatus.Pending]: 'warning',
  [VendorOrderStatus.AwaitingCustomerApproval]: 'warning',
  [VendorOrderStatus.PendingPayment]: 'warning',
  [VendorOrderStatus.Confirmed]: 'info',
  [VendorOrderStatus.InProgress]: 'info',
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
  private readonly translationService = inject(TranslationService);

  readonly status = input.required<VendorOrderStatus>();
  readonly size = input<'sm' | 'lg'>('sm');

  readonly statusLabel = computed(() => {
    this.translationService.currentLang();
    return this.translationService.translate(STATUS_KEYS[this.status()]);
  });

  readonly statusAriaLabel = computed(() => {
    this.translationService.currentLang();
    return `${this.translationService.translate('VENDOR.COMMON.STATUS')} ${this.statusLabel()}`;
  });

  readonly badgeClass = computed(
    () => `status-badge--${STATUS_VARIANTS[this.status()]}`
  );

  readonly sizeClass = computed(
    () => `status-badge--${this.size()}`
  );
}
