import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { authGuard } from '../../core/guards/auth.guard';

export const checkoutRoutes: Routes = [
  {
    path: APP_ROUTES.CHECKOUT,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/checkout-form/checkout-form.component').then((m) => m.CheckoutFormComponent),
  }
];
