import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { authGuard } from '../../core/guards/auth.guard';

export const favoritesRoutes: Routes = [
  {
    path: APP_ROUTES.FAVORITES,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/favorites/favorites.component').then((m) => m.Favorites),
  },
];

