import { Routes } from '@angular/router';

export const categoriesRoutes: Routes = [
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/category-list/category-list.component').then((m) => m.CategoryListComponent),
  }
];
