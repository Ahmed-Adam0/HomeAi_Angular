import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { authGuard } from '../../core/guards/auth.guard';

export const addressesRoutes: Routes = [
  {
    path: APP_ROUTES.ADDRESSES,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/address-list/address-list.component').then((m) => m.AddressListComponent),
  }
];
