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
    const context = error.url?.includes('login') ? 'login' : undefined;
    return this.authErrorHandler.handle(error, context);
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
