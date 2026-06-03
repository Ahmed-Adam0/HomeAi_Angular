import { Routes } from '@angular/router';

export const contactRoutes: Routes = [
  {
    path: 'contact',
    loadComponent: () =>
      import('./pages/contact-page/contact-page.component').then((m) => m.ContactPageComponent),
  },
];
