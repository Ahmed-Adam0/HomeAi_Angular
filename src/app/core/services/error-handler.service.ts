import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../shared/services/notification.service';
import { TranslationService } from '../../shared/i18n/translation.service';

import { AuthErrorHandler } from '../../features/auth/services/auth-error-handler.service';

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
  private readonly authErrorHandler = inject(AuthErrorHandler);

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
    const lang = this.translationService.currentLang();

    // 1. Client-side or network error
    if (error.error instanceof ErrorEvent) {
      return lang === 'ar'
        ? `خطأ في الشبكة: ${error.error.message}`
        : `Network error: ${error.error.message}`;
    }

    // Extract raw backend message if available
    let backendMsg: string | null = null;
    if (error.error) {
      const body = error.error as BackendErrorResponse;

      if (typeof body.message === 'string' && body.message.trim() !== '') {
        backendMsg = body.message;
      } else if (body.errors) {
        if (Array.isArray(body.errors)) {
          const messages = body.errors.filter((e): e is string => typeof e === 'string' && e.trim() !== '');
          if (messages.length > 0) {
            backendMsg = messages.join('\n');
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
            backendMsg = messages.join('\n');
          }
        }
      } else if (typeof error.error === 'string' && error.error.trim() !== '') {
        backendMsg = error.error;
      }
    }

    // Helper to identify raw technical/system errors (which shouldn't be exposed)
    const isTechnicalError = (msg: string): boolean => {
      const lower = msg.toLowerCase();
      return lower.includes('exception') ||
             lower.includes('stacktrace') ||
             lower.includes('stack trace') ||
             lower.includes('errorcode') ||
             lower.includes('sql') ||
             lower.includes('database') ||
             lower.includes('nullreference') ||
             lower.includes('internal server error') ||
             lower.includes('http status') ||
             lower.includes('system.data') ||
             lower.includes('system.web') ||
             msg.trim().startsWith('{') ||
             msg.trim().startsWith('<');
    };

    // Filter out technical errors from being considered as valid backend messages
    if (backendMsg && isTechnicalError(backendMsg)) {
      backendMsg = null;
    }

    // Apply Priority & Language rules:
    if (lang === 'ar') {
      // 1. Try to translate the backend message if available
      if (backendMsg) {
        const lines = backendMsg.split('\n');
        const translatedLines = lines.map(line => this.authErrorHandler.localizeMessage(line));
        
        // If all lines were successfully translated:
        if (translatedLines.every(line => line !== null)) {
          return translatedLines.join('\n');
        }
      }

      // 2. Safe Arabic Fallbacks (Second Priority)
      switch (error.status) {
        case 400:
        case 401:
          return error.url?.includes('login')
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'يرجى التحقق من البيانات المدخلة';
        case 403:
          return 'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني';
        case 404:
          return 'المورد المطلوب غير موجود';
        case 500:
          return 'حدث خطأ ما، يرجى المحاولة مرة أخرى لاحقاً';
        default:
          return 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.';
      }
    } else {
      // English UI:
      // 1. Use backend message directly if available (First Priority)
      if (backendMsg) {
        return backendMsg;
      }

      // 2. Predefined English Fallbacks (Second Priority)
      switch (error.status) {
        case 400:
        case 401:
          return error.url?.includes('login')
            ? 'Email or password is incorrect'
            : 'Please check your entered data';
        case 403:
          return 'You have been removed by the admin. Please contact support.';
        case 404:
          return 'The requested resource was not found';
        case 500:
          return 'Something went wrong, please try again later';
        default:
          return error.statusText || 'An unexpected error occurred. Please try again later.';
      }
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
