import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LOCAL_STORAGE_KEYS } from '../constants';

/**
 * Functional interceptor to automatically attach the JWT access token
 * from localStorage into the Authorization header of outgoing HTTP requests.
 * 
 * Safe for Server-Side Rendering (SSR) by verifying the platform execution context
 * before accessing localStorage.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  
  // Safely retrieve the token if running in the browser
  let token: string | null = null;
  if (isPlatformBrowser(platformId)) {
    token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
  }

  // Clone the request and append the Authorization Bearer token if present
  if (token) {
    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedReq);
  }

  // Return the original request unmodified if no token is available
  return next(req);
};
