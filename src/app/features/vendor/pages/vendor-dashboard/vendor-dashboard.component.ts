import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_ROUTES } from '../../../../core/constants/app-routes';
import {
  AnalyticsCards,
  NotificationsList,
  OrdersTable,
  RevenueCards,
  VendorStatsOverview,
} from '../../components';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    VendorStatsOverview,
    RevenueCards,
    AnalyticsCards,
    OrdersTable,
    NotificationsList,
  ],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.css',
})
export class VendorDashboard {
  readonly routes = NAV_ROUTES;
}
