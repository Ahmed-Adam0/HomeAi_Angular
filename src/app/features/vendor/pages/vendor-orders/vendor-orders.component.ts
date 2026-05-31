import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { OrdersTable } from '../../components';
import { IVendorOrderSummary } from '../../interfaces';
import { VendorService } from '../../services/vendor.service';

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

  readonly statusFilterOptions: readonly OrderStatusFilterOption[] = [
    { value: 'all', labelKey: 'VENDOR.ORDERS.FILTER_ALL_STATUSES' },
    { value: 'pending', labelKey: 'VENDOR.STATUS.PENDING' },
    { value: 'processing', labelKey: 'VENDOR.STATUS.PROCESSING' },
    { value: 'shipped', labelKey: 'VENDOR.STATUS.SHIPPED' },
    { value: 'delivered', labelKey: 'VENDOR.STATUS.DELIVERED' },
    { value: 'cancelled', labelKey: 'VENDOR.STATUS.CANCELLED' },
  ];

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

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(value);
  }

  onViewOrder(_id: string): void {}

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
          console.log('VendorOrders.loadOrders orders received:', summaries);
          console.log('VendorOrders.loadOrders orders.length:', summaries.length);
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
