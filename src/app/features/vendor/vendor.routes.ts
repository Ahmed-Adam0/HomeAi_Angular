import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { AuthLayoutComponent } from '../../core/layouts/auth-layout/auth-layout.component';
import { VendorLayoutComponent } from '../../core/layouts/vendor-layout/vendor-layout.component';

export const vendorRoutes: Routes = [
  // 1. Guest Auth Routes (wrapped in AuthLayoutComponent)
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: APP_ROUTES.VENDOR_LOGIN, // 'login'
        loadComponent: () =>
          import('../vendor-auth/pages/vendor-login/vendor-login.component').then(
            (m) => m.VendorLogin,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_REGISTER, // 'register'
        loadComponent: () =>
          import('../vendor-auth/pages/vendor-register/vendor-register.component').then(
            (m) => m.VendorRegister,
          ),
      },
    ],
  },
  // 2. Vendor Dashboard/Orders Routes (wrapped in VendorLayoutComponent)
  {
    path: '',
    component: VendorLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: APP_ROUTES.VENDOR_DASHBOARD,
        pathMatch: 'full',
      },
      {
        path: APP_ROUTES.VENDOR_DASHBOARD, // 'dashboard'
        loadComponent: () =>
          import('./pages/vendor-dashboard/vendor-dashboard.component').then(
            (m) => m.VendorDashboard,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_ORDERS, // 'orders'
        loadComponent: () =>
          import('./pages/vendor-orders/vendor-orders.component').then((m) => m.VendorOrders),
      },
      {
        path: APP_ROUTES.VENDOR_ORDER_DETAILS, // 'orders/:id'
        loadComponent: () =>
          import('./pages/vendor-order-details/vendor-order-details.component').then(
            (m) => m.VendorOrderDetails,
          ),
      },
    
      {
        path: APP_ROUTES.VENDOR_REVENUE, // 'revenue'
        loadComponent: () =>
          import('./pages/vendor-revenue/vendor-revenue.component').then((m) => m.VendorRevenue),
      },
      {
        path: APP_ROUTES.VENDOR_ANALYTICS, // 'analytics'
        loadComponent: () =>
          import('./pages/vendor-analytics/vendor-analytics.component').then(
            (m) => m.VendorAnalytics,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_PROFILE, // 'profile'
        loadComponent: () =>
          import('./pages/vendor-workshop-profile/vendor-workshop-profile.component').then(
            (m) => m.VendorWorkshopProfile,
          ),
      },
      {
        path: APP_ROUTES.VENDOR_NOTIFICATIONS, // 'notifications'
        loadComponent: () =>
          import('./pages/vendor-notifications/vendor-notifications.component').then(
            (m) => m.VendorNotifications,
          ),
      }
    ],
  },
];
