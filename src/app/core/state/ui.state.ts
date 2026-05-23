import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiState {
  // Global loading overlay signal
  readonly globalLoading = signal<boolean>(false);

  // Filter sidebar visibility signal
  readonly sidebarVisible = signal<boolean>(false);

  // Global toasts/alerts signal
  readonly activeAlert = signal<{ type: 'success' | 'danger' | 'warning' | 'info'; message: string } | null>(null);

  showLoader(): void {
    this.globalLoading.set(true);
  }

  hideLoader(): void {
    this.globalLoading.set(false);
  }

  toggleSidebar(): void {
    this.sidebarVisible.update((state) => !state);
  }

  showAlert(type: 'success' | 'danger' | 'warning' | 'info', message: string): void {
    this.activeAlert.set({ type, message });
    setTimeout(() => {
      this.activeAlert.set(null);
    }, 4000);
  }

  dismissAlert(): void {
    this.activeAlert.set(null);
  }
}
