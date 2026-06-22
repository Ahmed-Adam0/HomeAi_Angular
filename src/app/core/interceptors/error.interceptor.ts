import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandlerService = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Professional logging in console
      console.group(`🔴 HTTP Error Intercepted: [${req.method}] ${req.url}`);
      console.error(`Status: ${error.status} (${error.statusText || 'Unknown Status'})`);
      console.error('Error Details:', error.error);
      console.error('Full Error Object:', error);
      console.groupEnd();

      // Delegate global handling, mapping, and display to the dedicated service
      errorHandlerService.handleError(error);

      return throwError(() => error);
    })
  );
};
