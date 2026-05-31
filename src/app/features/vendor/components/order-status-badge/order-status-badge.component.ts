import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

type OrderStatusBadgeVariant = 'warning' | 'info' | 'primary' | 'success' | 'danger';

const STATUS_KEYS: Record<VendorOrderStatus, string> = {
  [VendorOrderStatus.Accepted]: 'VENDOR.STATUS.CONFIRMED',
  [VendorOrderStatus.InProgress]: 'VENDOR.STATUS.PROCESSING',
  [VendorOrderStatus.ReadyForPickup]: 'VENDOR.STATUS.SHIPPED',
  [VendorOrderStatus.Delivered]: 'VENDOR.STATUS.DELIVERED',
  [VendorOrderStatus.Cancelled]: 'VENDOR.STATUS.CANCELLED',
};

const STATUS_VARIANTS: Record<VendorOrderStatus, OrderStatusBadgeVariant> = {
  [VendorOrderStatus.Accepted]: 'info',
  [VendorOrderStatus.InProgress]: 'info',
  [VendorOrderStatus.ReadyForPickup]: 'primary',
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
}
