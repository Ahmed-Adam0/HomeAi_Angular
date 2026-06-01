import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { authGuard } from '../../core/guards/auth.guard';

console.log('[vendor.routes.ts] loaded!');

export const vendorRoutes: Routes = [
  {
    path: 'vendor/login',
    pathMatch: 'full',
    redirectTo: '/auth/login',
  },
  {
    path: APP_ROUTES.VENDOR,
    // canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/vendor-dashboard/vendor-dashboard.component').then(
            (m) => m.VendorDashboard,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/vendor-products/vendor-products.component').then(
            (m) => m.VendorProducts,
          ),
      },
      {
        path: 'products/add',
        loadComponent: () =>
          import('./pages/vendor-product-add/vendor-product-add.component').then(
            (m) => m.VendorProductAdd,
          ),
      },
      {
        path: 'products/edit/:id',
        loadComponent: () =>
          import('./pages/vendor-product-edit/vendor-product-edit.component').then(
            (m) => m.VendorProductEdit,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_ORDERS,
        loadComponent: () =>
          import('./pages/vendor-orders/vendor-orders.component').then((m) => m.VendorOrders),
      },
      {
        path: APP_ROUTES.VENDOR_ORDER_DETAILS,
        loadComponent: () =>
          import('./pages/vendor-order-details/vendor-order-details.component').then(
            (m) => m.VendorOrderDetails,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_REVENUE,
        loadComponent: () =>
          import('./pages/vendor-revenue/vendor-revenue.component').then((m) => m.VendorRevenue),
      },
      {
        path: APP_ROUTES.VENDOR_ANALYTICS,
        loadComponent: () =>
          import('./pages/vendor-analytics/vendor-analytics.component').then(
            (m) => m.VendorAnalytics,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_PROFILE,
        loadComponent: () =>
          import('./pages/vendor-workshop-profile/vendor-workshop-profile.component').then(
            (m) => m.VendorWorkshopProfile,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_NOTIFICATIONS,
        loadComponent: () =>
          import('./pages/vendor-notifications/vendor-notifications.component').then(
            (m) => m.VendorNotifications,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_REVIEWS,
        loadComponent: () =>
          import('./pages/vendor-reviews/vendor-reviews.component').then(
            (m) => m.VendorReviews,
          ),
      },
    ],
  },
];
