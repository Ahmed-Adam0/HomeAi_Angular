import { Routes } from '@angular/router';

export const paymentRoutes: Routes = [
  {
    path: 'payment',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/payment-processing/payment-processing.component').then((m) => m.PaymentProcessingComponent),
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./pages/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent),
      },
      {
        path: 'failed',
        loadComponent: () =>
          import('./pages/payment-failed/payment-failed.component').then((m) => m.PaymentFailedComponent),
      }
    ]
  }
];
