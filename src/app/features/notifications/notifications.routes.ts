import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const notificationsRoutes: Routes = [
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/notification-center/notification-center.component').then((m) => m.NotificationCenterComponent),
  }
];

