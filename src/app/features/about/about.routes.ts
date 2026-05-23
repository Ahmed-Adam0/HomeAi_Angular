import { Routes } from '@angular/router';

export const aboutRoutes: Routes = [
  {
    path: 'about',
    loadComponent: () =>
      import('./pages/about-us/about-us.component').then((m) => m.AboutUsComponent),
  }
];
