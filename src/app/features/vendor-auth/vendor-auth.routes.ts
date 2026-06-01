import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { guestGuard } from '../../core/guards/guest.guard';
import { AuthLayoutComponent } from '../../core/layouts/auth-layout/auth-layout.component';

export const vendorAuthRoutes: Routes = [
  {
    path: APP_ROUTES.VENDOR,
    children: [
      {
        path: APP_ROUTES.VENDOR_LOGIN,
        component: AuthLayoutComponent,
        children: [
          {
            path: '',
            canActivate: [guestGuard],
            loadComponent: () =>
              import('./pages/vendor-login/vendor-login.component').then((m) => m.VendorLogin),
          },
        ],
      },
      {
        path: APP_ROUTES.VENDOR_REGISTER,
        component: AuthLayoutComponent,
        children: [
          {
            path: '',
            canActivate: [guestGuard],
            loadComponent: () =>
              import('./pages/vendor-register/vendor-register.component').then((m) => m.VendorRegister),
          },
        ],
      },
    ],
  },
];

