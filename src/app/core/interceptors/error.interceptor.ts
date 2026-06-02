import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Professional logging in console
      console.group(`🔴 HTTP Error Intercepted: [${req.method}] ${req.url}`);
      console.error(`Status: ${error.status} (${error.statusText || 'Unknown Status'})`);
      console.error('Error Details:', error.error);
      console.error('Full Error Object:', error);
      console.groupEnd();

      let userMessage = 'An unexpected error occurred. Please try again later.';

      if (error.error instanceof Error) {
        // Client-side or network error
        userMessage = `Network error: ${error.error.message}`;
      } else {
        // Server-side error
        switch (error.status) {
          case 0:
            userMessage = 'Cannot connect to the server. Please check your internet connection.';
            break;
          case 400:
            userMessage = error.error?.message || 'Invalid request. Please check the submitted data.';
            break;
          case 401:
            userMessage = 'Your session has expired. Please log in again.';
            break;
          case 403:
            userMessage = 'You do not have permission to perform this action.';
            break;
          case 404:
            userMessage = 'The requested resource was not found.';
            break;
          case 500:
            userMessage = 'Internal Server Error. Please contact support if the issue persists.';
            break;
          default:
            userMessage = error.error?.message || `Error ${error.status}: ${error.statusText || 'Unknown Error'}`;
            break;
        }
      }

      // PREPARED FOR TOAST NOTIFICATIONS:
      // Once ToastService/NotificationService is implemented, invoke it:
      // toastService.showError(userMessage, 'Error');

      // Console notification preview for developer testing
      console.warn(`[Toast Notification Preview] Title: Error, Message: ${userMessage}`);

      return throwError(() => error);
    })
  );
};
