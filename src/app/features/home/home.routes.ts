import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const homeRoutes: Routes = [
  {
    path: APP_ROUTES.HOME,
    loadComponent: () =>
      import('./pages/premium-home/premium-home.component').then((m) => m.PremiumHomeComponent),
  },
];
