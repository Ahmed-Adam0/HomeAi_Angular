import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';

export const productsRoutes: Routes = [
  {
    path: APP_ROUTES.PRODUCTS,
    loadComponent: () =>
      import('./pages/product-list/product-list.component').then((m) => m.ProductList),
  },
  {
    path: APP_ROUTES.PRODUCT_DETAILS,
    loadComponent: () =>
      import('./pages/product-details/product-details.component').then((m) => m.ProductDetails),
  },
  {
    path: APP_ROUTES.FILTER_SIDEBAR,
    loadComponent: () =>
      import('./components/filter-sidebar/filter-sidebar.component').then((m) => m.FilterSidebar),
  },
];
