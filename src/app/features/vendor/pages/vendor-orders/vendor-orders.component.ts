import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { OrdersTable } from '../../components';
import { IVendorOrderSummary } from '../../interfaces';
import { VendorService } from '../../services/vendor.service';
import { APP_ROUTES } from '../../../../core/constants';
import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

interface OrderStatusFilterOption {
  readonly value: string;
  readonly labelKey: string;
}

@Component({
  selector: 'app-vendor-orders',
  standalone: true,
  imports: [OrdersTable, TranslatePipe],
  templateUrl: './vendor-orders.component.html',
  styleUrl: './vendor-orders.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorOrders implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<IVendorOrderSummary[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly searchTerm = signal('');
  readonly selectedStatus = signal<string>('all');

  /** Toggle for the collapsible filter area on mobile/tablet */
  readonly showMobileFilters = signal(false);

  readonly statusFilterOptions: readonly OrderStatusFilterOption[] = [
    { value: 'all', labelKey: 'VENDOR.ORDERS.FILTER_ALL_STATUSES' },
    { value: VendorOrderStatus.Pending, labelKey: 'VENDOR.STATUS.PENDING' },
    { value: VendorOrderStatus.Confirmed, labelKey: 'VENDOR.STATUS.CONFIRMED' },
    { value: VendorOrderStatus.Processing, labelKey: 'VENDOR.STATUS.PROCESSING' },
    { value: VendorOrderStatus.Ready, labelKey: 'VENDOR.STATUS.SHIPPED' },
    { value: VendorOrderStatus.Delivered, labelKey: 'VENDOR.STATUS.DELIVERED' },
    { value: VendorOrderStatus.Cancelled, labelKey: 'VENDOR.STATUS.CANCELLED' },
  ];

  private readonly router = inject(Router);

  readonly filteredOrders = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const status = this.selectedStatus();
    let result = this.orders();

    if (status !== 'all') {
      result = result.filter((order) => order.status === status);
    }

    if (!term) {
      return result;
    }

    return result.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.customerName.toLowerCase().includes(term)
    );
  });

  readonly activeFilterLabel = computed(() => {
    const selected = this.selectedStatus();
    if (selected === 'all') return null;
    const opt = this.statusFilterOptions.find((o) => o.value === selected);
    return opt?.labelKey ?? null;
  });

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchTerm.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement)?.value ?? 'all';
    this.selectedStatus.set(value);
    this.showMobileFilters.set(false);
  }

  toggleMobileFilters(): void {
    this.showMobileFilters.update((v) => !v);
  }

  onViewOrder(id: string): void {
    this.router.navigate([APP_ROUTES.VENDOR, APP_ROUTES.VENDOR_ORDERS, id]);
  }

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vendorService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (summaries) => {
          this.orders.set(summaries);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load vendor orders:', err);
          this.error.set(err.message || 'An error occurred while loading vendor orders.');
          this.loading.set(false);
        },
      });
  }
}
