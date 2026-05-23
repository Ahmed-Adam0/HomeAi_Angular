import { Routes } from '@angular/router';

export const errorsRoutes: Routes = [
  {
    path: '404',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
  {
    path: '401',
    loadComponent: () =>
      import('./pages/unauthorized/unauthorized.component').then((m) => m.UnauthorizedComponent),
  },
  {
    path: '500',
    loadComponent: () =>
      import('./pages/server-error/server-error.component').then((m) => m.ServerErrorComponent),
  },
];
