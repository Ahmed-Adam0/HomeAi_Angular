import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const cartRoutes: Routes = [
  {
    path: APP_ROUTES.CART,
    loadComponent: () =>
      import('./pages/cart/cart.component').then((m) => m.Cart),
  },
];
