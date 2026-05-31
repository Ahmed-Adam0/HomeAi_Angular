import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import {
  AnalyticsCards,
  NotificationsList,
  OrdersTable,
  RevenueCards,
  VendorStatsOverview,
} from '../../components';
import {
  IVendorAnalytics,
  IVendorNotification,
  IVendorOrderSummary,
  IVendorRevenue,
} from '../../interfaces';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { VendorService } from '../../services/vendor.service';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    VendorStatsOverview,
    RevenueCards,
    AnalyticsCards,
    OrdersTable,
    NotificationsList,
    TranslatePipe,
  ],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDashboard {
  private readonly vendorService = inject(VendorService);

  readonly analytics = signal<IVendorAnalytics | null>(null);
  readonly revenue = signal<IVendorRevenue | null>(null);
  readonly orders = signal<IVendorOrderSummary[]>([]);
  readonly notifications = signal<IVendorNotification[]>([]);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly hasOrders = computed(() => this.orders().length > 0);
  readonly hasNotifications = computed(() => this.notifications().length > 0);

  constructor() {
    this.loadDashboardMetrics();
  }

  private loadDashboardMetrics(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      analytics: this.vendorService.getDashboardMetrics(),
      revenue: this.vendorService.getRevenue(),
      orders: this.vendorService.getOrders(),
    })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ analytics, revenue, orders }) => {
          this.analytics.set(analytics);
          this.revenue.set(revenue);
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load vendor dashboard metrics:', err);
          this.error.set(err.message || 'An error occurred while loading dashboard metrics.');
          this.loading.set(false);
        }
      });
  }
}
