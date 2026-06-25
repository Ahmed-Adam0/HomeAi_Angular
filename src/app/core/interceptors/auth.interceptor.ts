import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../constants';
import { AuthService } from '../../features/auth/services/auth.service';
import { NotificationService } from '../../shared/services/notification.service';

/**
 * Functional interceptor to automatically attach the JWT access token securely
 * from localStorage into the Authorization header of outgoing HTTP requests.
 *
 * Intercepts 401 Unauthorized status globally to log out and redirect users.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const router = inject(Router);
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);

  // Safely retrieve the token if running in the browser
  let token: string | null = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
  }

  console.log('Current URL:', req.url);
  console.log('Token:', token);
  console.log('Auth result:', authService.isAuthenticated());

  // Clone the request and append the Authorization Bearer token if present
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log(`[authInterceptor] Appending Authorization header to request: [${req.method}] ${req.url}`);
  }

  // Return the request and capture any 401 Unauthorized or 403 Forbidden errors globally
  return next(clonedReq).pipe(
    catchError((error) => {
      if (isPlatformBrowser(platformId) && error instanceof HttpErrorResponse) {
        if (error.status === 401) {
          const wasAuthenticated = authService.isLoggedIn();

          console.warn(`[authInterceptor] Intercepted 401 Unauthorized for [${req.method}] ${req.url}.`);
          authService.logout();

          if (wasAuthenticated) {
            notificationService.error('AUTH.SESSION_EXPIRED_OR_INACTIVE');
            const targetRoute = router.url.startsWith('/vendor') ? NAV_ROUTES.VENDOR_LOGIN : NAV_ROUTES.LOGIN;
            console.warn(`[authInterceptor] Redirecting to ${targetRoute} after session expiry.`);
            void router.navigate([targetRoute], { queryParams: { returnUrl: router.url } });
          }
        } else if (error.status === 403) {
          const wasAuthenticated = authService.isLoggedIn();
          const isVendorUser = authService.isVendor() || router.url.startsWith('/vendor');

          console.warn(`[authInterceptor] Intercepted 403 Forbidden for [${req.method}] ${req.url}.`);
          authService.logout();

          if (wasAuthenticated) {
            notificationService.error('AUTH.SESSION_EXPIRED_OR_INACTIVE');
            const targetRoute = isVendorUser ? NAV_ROUTES.VENDOR_LOGIN : NAV_ROUTES.LOGIN;
            console.warn(`[authInterceptor] Redirecting to ${targetRoute} due to vendor account deactivation.`);
            void router.navigate([targetRoute]);
          }
        }
      }
      return throwError(() => error);
    })
  );
};
