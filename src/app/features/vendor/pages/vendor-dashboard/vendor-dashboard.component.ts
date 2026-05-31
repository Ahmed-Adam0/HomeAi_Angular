import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
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
  IVendorOrder,
  IVendorRevenue,
} from '../../interfaces';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

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
  readonly analytics = signal<IVendorAnalytics | null>(null);
  readonly revenue = signal<IVendorRevenue | null>(null);
  readonly orders = signal<IVendorOrder[]>([]);
  readonly notifications = signal<IVendorNotification[]>([]);

  readonly hasOrders = computed(() => this.orders().length > 0);
  readonly hasNotifications = computed(() => this.notifications().length > 0);
}
