import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const favoritesRoutes: Routes = [
  {
    path: APP_ROUTES.FAVORITES,
    loadComponent: () =>
      import('./pages/favorites/favorites.component').then((m) => m.Favorites),
  },
];
