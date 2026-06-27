import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';
import { AuthService } from '../../features/auth/services/auth.service';
import { LoadingService } from '../services/loading.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandlerService = inject(ErrorHandlerService);
  const authService = inject(AuthService);
  const loadingService = inject(LoadingService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Professional logging in console
      console.group(`🔴 HTTP Error Intercepted: [${req.method}] ${req.url}`);
      console.error(`Status: ${error.status} (${error.statusText || 'Unknown Status'})`);
      console.error('Error Details:', error.error);
      console.error('Full Error Object:', error);
      console.groupEnd();

      // For 401 Unauthorized or 403 Forbidden errors when the user is logged in,
      // the authInterceptor will handle the token clearance, toast notification, and redirection.
      // We skip delegating to errorHandlerService to prevent duplicate or generic toast notifications.
      const isAuthStatus = error.status === 401 || error.status === 403;
      const wasLoggedIn = authService.isLoggedIn();
      
      // Suppress the global error toast notification during initial loading/init tasks
      const isAppLoading = loadingService.isLoading();

      if (!(isAuthStatus && wasLoggedIn) && !isAppLoading) {
        // Delegate global handling, mapping, and display to the dedicated service
        errorHandlerService.handleError(error);
      }

      return throwError(() => error);
    })
  );
};
