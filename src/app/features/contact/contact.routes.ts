import { Routes } from '@angular/router';

export const contactRoutes: Routes = [
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact-us/contact-us.component').then((m) => m.ContactUsComponent),
  }
];
