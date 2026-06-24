import { Routes } from '@angular/router';
import { APP_ROUTES } from '../../core/constants';
import { guestGuard } from '../../core/guards/guest.guard';

export const authRoutes: Routes = [
  {
    path: APP_ROUTES.LOGIN,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.Login),
  },
  {
    path: APP_ROUTES.REGISTER,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.Register),
  },
  {
    path: APP_ROUTES.GOOGLE_SUCCESS,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/google-success/google-success.component').then((m) => m.GoogleSuccess),
  },
  {
    path: APP_ROUTES.COMPLETE_GOOGLE_REGISTRATION,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/complete-google-registration/complete-google-registration.component').then((m) => m.CompleteGoogleRegistration),
  },
  
  {
    path: APP_ROUTES.FORGOT_PASSWORD,
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPassword),
  },
  {
    path: APP_ROUTES.VERIFY_OTP,
    loadComponent: () =>
      import('./pages/verify-otp/verify-otp.component').then((m) => m.VerifyOtp),
  },
  {
    path: APP_ROUTES.RESET_PASSWORD,
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then((m) => m.ResetPassword),
  },
  {
    path: APP_ROUTES.CONFIRM_EMAIL_OTP,
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/confirm-email-otp/confirm-email-otp.component').then((m) => m.ConfirmEmailOtp),
  },
];
