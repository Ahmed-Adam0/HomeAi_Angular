import { Routes } from '@angular/router';

export const addressesRoutes: Routes = [
  {
    path: 'addresses',
    loadComponent: () =>
      import('./pages/address-list/address-list.component').then((m) => m.AddressListComponent),
  }
];
