import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { authGuard } from '../../core/guards/auth.guard';

export const profileRoutes: Routes = [
  {
    path: APP_ROUTES.PROFILE,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.Profile),
  },
];
