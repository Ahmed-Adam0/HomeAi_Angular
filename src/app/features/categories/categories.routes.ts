import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const categoriesRoutes: Routes = [
  {
    path: APP_ROUTES.CATEGORIES,
    loadComponent: () =>
      import('./pages/category-list/category-list.component').then((m) => m.CategoryListComponent),
  },
  {
    path: APP_ROUTES.CATEGORY_DETAIL,
    loadComponent: () =>
      import('./pages/category-detail-redirect/category-detail-redirect.component').then(
        (m) => m.CategoryDetailRedirectComponent
      ),
  },
];
