import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { OrdersTable } from '../../components';
import { IVendorOrder } from '../../interfaces';

interface OrderStatusFilterOption {
  readonly value: string;
  readonly label: string;
}

@Component({
  selector: 'app-vendor-orders',
  standalone: true,
  imports: [OrdersTable],
  templateUrl: './vendor-orders.component.html',
  styleUrl: './vendor-orders.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorOrders {
  readonly orders = signal<IVendorOrder[]>([]);
  readonly searchTerm = signal('');
  readonly selectedStatus = signal<string>('all');

  readonly statusFilterOptions: readonly OrderStatusFilterOption[] = [
    { value: 'all', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
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
        order.customer.fullName.toLowerCase().includes(term) ||
        order.items.some((item) => item.productName.toLowerCase().includes(term))
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
}
