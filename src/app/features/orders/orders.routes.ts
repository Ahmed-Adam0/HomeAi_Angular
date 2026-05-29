import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { authGuard } from '../../core/guards/auth.guard';

export const ordersRoutes: Routes = [
  {
    path: APP_ROUTES.ORDERS,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/orders/orders.component').then((m) => m.Orders),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/order-details/order-details.component').then((m) => m.OrderDetails),
      }
    ]
  }
];
