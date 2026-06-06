import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
    this.activeAlert.set(action ? { type, message, action } : { type, message });

    if (isPlatformBrowser(this.platformId)) {
      if (this.alertTimeout) {
        clearTimeout(this.alertTimeout);
      }
      this.alertTimeout = setTimeout(() => {
        this.activeAlert.set(null);
        this.alertTimeout = null;
      }, 2700);
    }
  }

  dismissAlert(): void {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
      this.alertTimeout = null;
    }
    this.activeAlert.set(null);
  }
}
