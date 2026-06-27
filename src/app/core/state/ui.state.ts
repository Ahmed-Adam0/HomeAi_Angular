import { Injectable, signal, inject, PLATFORM_ID, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../shared/i18n/translation.service';
import { NotificationService } from '../../shared/services/notification.service';

export interface AlertAction {
  label: string;
  routerLink: string;
}

export interface AlertData {
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  action?: AlertAction;
}

@Injectable({
  providedIn: 'root'
})
export class UiState {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translationService = inject(TranslationService);
  private readonly injector = inject(Injector);
  private alertTimeout: ReturnType<typeof setTimeout> | null = null;

  // Global loading overlay signal
  readonly globalLoading = signal<boolean>(false);

  // Filter sidebar visibility signal
  readonly sidebarVisible = signal<boolean>(false);

  // Global toasts/alerts signal
  readonly activeAlert = signal<AlertData | null>(null);

  showLoader(): void {
    this.globalLoading.set(true);
  }

  hideLoader(): void {
    this.globalLoading.set(false);
  }

  toggleSidebar(): void {
    this.sidebarVisible.update((state) => !state);
  }

  showAlert(type: AlertData['type'], message: string, action?: AlertAction): void {
    const notificationService = this.injector.get(NotificationService);
    if (type === 'danger') {
      notificationService.error(message, action, 'UiState');
    } else if (type === 'success') {
      notificationService.success(message, action, 'UiState');
    } else if (type === 'warning') {
      notificationService.warning(message, action, 'UiState');
    } else {
      notificationService.info(message, action, 'UiState');
    }
  }

  dismissAlert(): void {
    const notificationService = this.injector.get(NotificationService);
    // Since we route activeAlerts to NotificationService, we dismiss any notification in that queue or we can clear all.
    // However, since activeAlert is kept null, this is a fallback.
    this.activeAlert.set(null);
  }
}
