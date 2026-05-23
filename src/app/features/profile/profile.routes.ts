import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const profileRoutes: Routes = [
  {
    path: APP_ROUTES.PROFILE,
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.Profile),
  },
];
