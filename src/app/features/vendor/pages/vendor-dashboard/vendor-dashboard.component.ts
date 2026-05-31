import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import {
  AnalyticsCards,
  NotificationsList,
  OrdersTable,
  RevenueCards,
  VendorStatsOverview,
} from '../../components';
import {
  IVendorAnalytics,
  IVendorDashboardMetrics,
  IVendorNotification,
  IVendorOrderSummary,
  IVendorRevenue,
} from '../../interfaces';
import { APP_ROUTES } from '../../../../core/constants';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { VendorService } from '../../services/vendor.service';
import { mapVendorDashboardMetrics } from '../../data-access/mappers/vendor-order.mapper';

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
export class VendorDashboard implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly dashboardMetrics = signal<IVendorDashboardMetrics | null>(null);
  readonly revenue = signal<IVendorRevenue | null>(null);
  readonly orders = signal<IVendorOrderSummary[]>([]);
  readonly notifications = signal<IVendorNotification[]>([]);

  readonly analyticsLoading = signal<boolean>(false);
  readonly revenueLoading = signal<boolean>(false);
  readonly ordersLoading = signal<boolean>(false);

  readonly analyticsError = signal<string | null>(null);
  readonly revenueError = signal<string | null>(null);
  readonly ordersError = signal<string | null>(null);

  private readonly router = inject(Router);

  readonly hasOrders = computed(() => this.orders().length > 0);
  readonly hasNotifications = computed(() => this.notifications().length > 0);

  protected onViewOrder(id: string): void {
    this.router.navigate([APP_ROUTES.VENDOR, APP_ROUTES.VENDOR_ORDERS, id]);
  }

  /**
   * Computed signal that transforms dashboardMetrics to IVendorAnalytics
   * for backward compatibility with VendorStatsOverview and AnalyticsCards components
   */
  readonly analytics = computed((): IVendorAnalytics | null => {
    const metrics = this.dashboardMetrics();
    if (!metrics) return null;

    return mapVendorDashboardMetrics({
      totalOrders: metrics.totalOrders,
      activeOrders: metrics.activeOrders,
      completedOrders: metrics.completedOrders,
      totalRevenue: metrics.totalRevenue,
      newCustomersCount: metrics.newCustomersCount,
      orderGrowthPercentage: metrics.orderGrowthPercentage,
      averageOrderValue: metrics.averageOrderValue,
    });
  });

  ngOnInit(): void {
    this.loadAnalytics();
    this.loadRevenue();
    this.loadOrders();
  }

  private loadAnalytics(): void {
    this.analyticsLoading.set(true);
    this.analyticsError.set(null);

    this.vendorService
      .getDashboardMetrics()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.analyticsLoading.set(false))
      )
      .subscribe({
        next: (metrics) => this.dashboardMetrics.set(metrics),
        error: (err) => {
          console.error('Failed to load vendor analytics:', err);
          this.analyticsError.set(
            err?.message ?? 'Failed to load analytics data.'
          );
        },
      });
  }

  private loadRevenue(): void {
    this.revenueLoading.set(true);
    this.revenueError.set(null);

    this.vendorService
      .getRevenue()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.revenueLoading.set(false))
      )
      .subscribe({
        next: (revenue) => this.revenue.set(revenue),
        error: (err) => {
          console.error('Failed to load vendor revenue:', err);
          this.revenueError.set(
            err?.message ?? 'Failed to load revenue data.'
          );
        },
      });
  }

  private loadOrders(): void {
    this.ordersLoading.set(true);
    this.ordersError.set(null);

    this.vendorService
      .getOrders()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.ordersLoading.set(false))
      )
      .subscribe({
        next: (orders) => {
          console.log('VendorDashboard.loadOrders orders received:', orders);
          console.log('VendorDashboard.loadOrders orders.length:', orders.length);
          this.orders.set(orders);
        },
        error: (err) => {
          console.error('Failed to load vendor orders:', err);
          this.ordersError.set(
            err?.message ?? 'Failed to load recent orders.'
          );
        },
      });
  }
}
