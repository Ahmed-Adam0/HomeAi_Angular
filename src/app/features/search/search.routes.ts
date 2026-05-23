import { Routes } from '@angular/router';

export const searchRoutes: Routes = [
  {
    path: 'search',
    loadComponent: () =>
      import('./pages/search-results/search-results.component').then((m) => m.SearchResultsComponent),
  }
];
