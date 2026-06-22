import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../shared/services/notification.service';
import { TranslationService } from '../../shared/i18n/translation.service';

export interface BackendErrorResponse {
  message?: string;
  errors?: Record<string, string[] | string> | string[];
}

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private readonly notificationService = inject(NotificationService);
  private readonly translationService = inject(TranslationService);

  /**
   * Translates the fallback messages based on active language setting.
   */
  private getMessage(ar: string, en: string): string {
    const lang = this.translationService.currentLang();
    return lang === 'ar' ? ar : en;
  }

  /**
   * Maps an HttpErrorResponse to a user-friendly error message.
   */
  mapError(error: HttpErrorResponse): string {
    // 1. Client-side or network error
    if (error.error instanceof ErrorEvent) {
      return `${this.getMessage('خطأ في الشبكة: ', 'Network error: ')}${error.error.message}`;
    }

    // 2. Extract error message from backend response body
    if (error.error) {
      const body = error.error as BackendErrorResponse;

      // If backend returns `message`, use it.
      if (typeof body.message === 'string' && body.message.trim() !== '') {
        return body.message;
      }

      // If backend returns validation `errors`, combine and display validation messages.
      if (body.errors) {
        if (Array.isArray(body.errors)) {
          const messages = body.errors.filter((e): e is string => typeof e === 'string' && e.trim() !== '');
          if (messages.length > 0) {
            return messages.join('\n');
          }
        } else if (typeof body.errors === 'object') {
          const messages: string[] = [];
          const errorsObj = body.errors as Record<string, unknown>;
          for (const key of Object.keys(errorsObj)) {
            const fieldErrors = errorsObj[key];
            if (Array.isArray(fieldErrors)) {
              fieldErrors.forEach((err: unknown) => {
                if (typeof err === 'string' && err.trim() !== '') {
                  messages.push(err);
                }
              });
            } else if (typeof fieldErrors === 'string' && fieldErrors.trim() !== '') {
              messages.push(fieldErrors);
            }
          }
          if (messages.length > 0) {
            return messages.join('\n');
          }
        }
      }

      // If error.error is just a raw string
      if (typeof error.error === 'string' && error.error.trim() !== '') {
        return error.error;
      }
    }

    // 3. Fallback to friendly default messages based on status code
    switch (error.status) {
      case 400:
        return this.getMessage('يرجى التحقق من البيانات المدخلة', 'Please check your entered data');
      case 401:
        return this.getMessage('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى', 'Your session expired, please login again');
      case 404:
        return this.getMessage('المورد المطلوب غير موجود', 'The requested resource was not found');
      case 500:
        return this.getMessage('حدث خطأ ما، يرجى المحاولة مرة أخرى لاحقاً', 'Something went wrong, please try again later');
      default:
        return error.statusText || this.getMessage('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.', 'An unexpected error occurred. Please try again later.');
    }
  }

  /**
   * Process the HTTP error response by mapping it and notifying the user.
   */
  handleError(error: HttpErrorResponse): string {
    const userMessage = this.mapError(error);
    this.notificationService.error(userMessage);
    return userMessage;
  }
}
