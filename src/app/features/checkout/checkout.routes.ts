import { Routes } from '@angular/router';

export const checkoutRoutes: Routes = [
  {
    path: 'checkout',
    loadComponent: () =>
      import('./pages/checkout-form/checkout-form.component').then((m) => m.CheckoutFormComponent),
  }
];
