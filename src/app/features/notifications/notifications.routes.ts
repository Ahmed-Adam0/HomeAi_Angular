import { Routes } from '@angular/router';

export const notificationsRoutes: Routes = [
  {
    path: 'notifications',
    loadComponent: () =>
      import('./pages/notification-center/notification-center.component').then((m) => m.NotificationCenterComponent),
  }
];

