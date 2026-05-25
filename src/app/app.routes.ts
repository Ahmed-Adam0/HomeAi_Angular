import { Routes } from '@angular/router';
import { APP_ROUTES } from './core/constants';
import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { EmptyLayoutComponent } from './core/layouts/empty-layout/empty-layout.component';

export const routes: Routes = [
  // Auth Layout wrapper for authentication routes
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
      },
    ],
  },

  // Main Layout wrapper for shop and customer routes
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/home/home.routes').then((m) => m.homeRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/products/products.routes').then((m) => m.productsRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/cart/cart.routes').then((m) => m.cartRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.profileRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/favorites/favorites.routes').then((m) => m.favoritesRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/orders/orders.routes').then((m) => m.ordersRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/ai/ai.routes').then((m) => m.aiRoutes),
      },
      // New domain features loaded under Main Layout
      {
        path: '',
        loadChildren: () =>
          import('./features/categories/categories.routes').then((m) => m.categoriesRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/search/search.routes').then((m) => m.searchRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/checkout/checkout.routes').then((m) => m.checkoutRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then((m) => m.notificationsRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/addresses/addresses.routes').then((m) => m.addressesRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/about/about.routes').then((m) => m.aboutRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/contact/contact.routes').then((m) => m.contactRoutes),
      },
    ],
  },

  // Empty Layout wrapper for errors and full screen checkout/payments
  {
    path: '',
    component: EmptyLayoutComponent,
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/errors/errors.routes').then((m) => m.errorsRoutes),
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/payment/payment.routes').then((m) => m.paymentRoutes),
      },
    ],
  },

  // Wildcard / Not Found Route redirects to /404 page
  {
    path: APP_ROUTES.WILDCARD,
    redirectTo: '/404',
    pathMatch: 'full'
  },
];