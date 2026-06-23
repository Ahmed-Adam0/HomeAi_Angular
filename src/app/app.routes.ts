import { Routes } from '@angular/router';

import { APP_ROUTES } from './core/constants';

console.log('[app.routes.ts] loaded!');

import { MainLayoutComponent } from './core/layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './core/layouts/auth-layout/auth-layout.component';
import { EmptyLayoutComponent } from './core/layouts/empty-layout/empty-layout.component';
import { customerGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: APP_ROUTES.LOGIN,
        pathMatch: 'full',
      },
      {
        path: '',
        loadChildren: () =>
          import('./features/auth/auth.routes').then((m) => m.authRoutes),
      },
    ],
  },
  {
    path: 'vendor',
    loadChildren: () =>
      import('./features/vendor/vendor.routes').then((m) => m.vendorRoutes),
  },
  {
    path: 'login',
    pathMatch: 'full',
    redirectTo: '/auth/login',
  },
  {
    path: 'register',
    pathMatch: 'full',
    redirectTo: '/auth/register',
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [customerGuard],
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
      {
        path: 'inspirations',
        loadComponent: () =>
          import('./features/inspirations/pages/inspirations-page/inspirations-page.component').then((m) => m.InspirationsPageComponent),
      },
    ],
  },
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
  {
    path: APP_ROUTES.WILDCARD,
    redirectTo: APP_ROUTES.NOT_FOUND,
    pathMatch: 'full',
  },
];
