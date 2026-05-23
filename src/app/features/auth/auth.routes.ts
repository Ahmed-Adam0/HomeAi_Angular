import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const authRoutes: Routes = [
  {
    path: APP_ROUTES.LOGIN,
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.Login),
  },
  {
    path: APP_ROUTES.REGISTER,
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.Register),
  },
];
