import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const inspirationsRoutes: Routes = [
  {
    path: APP_ROUTES.INSPIRATIONS,
    loadComponent: () =>
      import('./pages/inspirations-page/inspirations-page.component').then((m) => m.InspirationsPageComponent),
  },
  {
    path: APP_ROUTES.SHARE_TRANSFORMATION,
    loadComponent: () =>
      import('./pages/share-transformation/share-transformation.component').then((m) => m.ShareTransformationComponent),
  },
];
