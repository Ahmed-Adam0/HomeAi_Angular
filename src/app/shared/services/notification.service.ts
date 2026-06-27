import { Injectable, signal, inject, Injector, OnDestroy } from '@angular/core';
import { AlertAction } from '../../core/state/ui.state';
import { TranslationService } from '../i18n/translation.service';

export interface Notification {
  id: number;
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  action?: AlertAction;
  source?: string;
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
  private readonly injector = inject(Injector);
  readonly notifications = signal<Notification[]>([]);

  private queue: Notification[] = [];
  private readonly maxVisible = 3;
  private readonly duplicateCooldownMs = 800;
  private dismissTimers = new Map<number, any>();
  private recentNotifications: {
    type: string;
    message: string;
    action?: string;
    source?: string;
    timestamp: number;
  }[] = [];

  success(message: string, action?: AlertAction, source?: string): void {
    this.add('success', message, action, source);
  }

  error(message: string, action?: AlertAction, source?: string): void {
    this.add('danger', message, action, source);
  }

  warning(message: string, action?: AlertAction, source?: string): void {
    this.add('warning', message, action, source);
  }

  info(message: string, action?: AlertAction, source?: string): void {
    this.add('info', message, action, source);
  }

  // Aliases for compatibility
  showSuccess(message: string, action?: AlertAction, source?: string): void {
    this.success(message, action, source);
  }

  showError(message: string, action?: AlertAction, source?: string): void {
    this.error(message, action, source);
  }

  showWarning(message: string, action?: AlertAction, source?: string): void {
    this.warning(message, action, source);
  }

  showInfo(message: string, action?: AlertAction, source?: string): void {
    this.info(message, action, source);
  }

  dismiss(id: number): void {
    if (this.dismissTimers.has(id)) {
      clearTimeout(this.dismissTimers.get(id));
      this.dismissTimers.delete(id);
    }
    this.notifications.update((list) => list.filter((n) => n.id !== id));
    this.processQueue();
  }

  ngOnDestroy(): void {
    this.dismissTimers.forEach((timerId) => clearTimeout(timerId));
    this.dismissTimers.clear();
  }

  private add(type: Notification['type'], message: string, action?: AlertAction, source?: string): void {
    const translationService = this.injector.get(TranslationService);
    const translatedMsg = translationService.translate(message);
    const now = Date.now();

    // Clean up expired history entries
    this.recentNotifications = this.recentNotifications.filter(
      (n) => now - n.timestamp < this.duplicateCooldownMs
    );

    // Duplicate check
    const actionKey = action ? `${action.label}:${action.routerLink}` : '';
    const isDuplicate = this.recentNotifications.some(
      (n) =>
        n.type === type &&
        n.message === translatedMsg &&
        n.action === actionKey &&
        n.source === source
    );

    if (isDuplicate) {
      console.warn(`[NotificationService] Duplicate notification ignored: "${translatedMsg}"`);
      return;
    }

    // Record this notification as recent
    this.recentNotifications.push({
      type,
      message: translatedMsg,
      action: actionKey,
      source,
      timestamp: now,
    });

    const id = nextId++;
    const notification: Notification = { id, type, message: translatedMsg, action, source };
    this.queue.push(notification);
    this.processQueue();
  }

  private processQueue(): void {
    while (this.notifications().length < this.maxVisible && this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        this.notifications.update((list) => [...list, next]);
        const timerId = setTimeout(() => {
          this.dismiss(next.id);
        }, 3500);
        this.dismissTimers.set(next.id, timerId);
      }
    }
  }
}

