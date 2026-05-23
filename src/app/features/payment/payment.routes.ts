import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: 'payment',
    loadComponent: () =>
      import('./pages/payment-processing/payment-processing.component').then((m) => m.PaymentProcessingComponent),
  }
];
