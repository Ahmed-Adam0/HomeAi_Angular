import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { LOCAL_STORAGE_KEYS } from '../constants';
import { AuthService } from '../../features/auth/services/auth.service';

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

  // Return the request and capture any 401 Unauthorized errors globally
  return next(clonedReq).pipe(
    catchError((error) => {
      if (isPlatformBrowser(platformId) && error instanceof HttpErrorResponse && error.status === 401) {
        console.warn(`[authInterceptor] Intercepted 401 Unauthorized for [${req.method}] ${req.url}. Redirecting to login.`);
        authService.logout();
        void router.navigate(['/vendor/login']);
      }
      return throwError(() => error);
    })
  );
};
