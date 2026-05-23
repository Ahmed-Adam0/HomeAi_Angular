import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const ordersRoutes: Routes = [
  {
    path: APP_ROUTES.ORDERS,
    loadComponent: () =>
      import('./pages/orders/orders.component').then((m) => m.Orders),
  },
  {
    path: APP_ROUTES.ORDER_DETAILS,
    loadComponent: () =>
      import('./pages/order-details/order-details.component').then((m) => m.OrderDetails),
  },
];
