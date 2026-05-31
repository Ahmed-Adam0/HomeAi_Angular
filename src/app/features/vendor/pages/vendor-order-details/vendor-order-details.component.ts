import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { OrderStatusBadge } from '../../components';
import { IVendorOrder } from '../../interfaces';
import { VendorService } from '../../services/vendor.service';

@Component({
  selector: 'app-vendor-order-details',
  standalone: true,
  imports: [CommonModule, OrderStatusBadge, TranslatePipe],
  templateUrl: './vendor-order-details.component.html',
  styleUrl: './vendor-order-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorOrderDetails implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly order = signal<IVendorOrder | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  protected readonly skeletonItems = Array(3);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Order ID is missing in the route parameters.');
      return;
    }

    this.loadOrderDetails(id);
  }

  private loadOrderDetails(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.vendorService
      .getOrderById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderData) => {
          this.order.set(orderData);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load vendor order details:', err);
          this.error.set(err.message || 'An error occurred while loading order details.');
          this.loading.set(false);
        },
      });
  }
}
