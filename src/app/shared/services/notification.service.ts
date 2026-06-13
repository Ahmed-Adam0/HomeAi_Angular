import { Injectable, signal } from '@angular/core';
import { AlertAction } from '../../core/state/ui.state';

export interface Notification {
  id: number;
  type: 'success' | 'danger' | 'warning' | 'info';
  message: string;
  action?: AlertAction;
}

let nextId = 1;

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);

  success(message: string, action?: AlertAction): void {
    this.add('success', message, action);
  }

  error(message: string, action?: AlertAction): void {
    this.add('danger', message, action);
  }

  warning(message: string, action?: AlertAction): void {
    this.add('warning', message, action);
  }

  info(message: string, action?: AlertAction): void {
    this.add('info', message, action);
  }

  dismiss(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  private add(type: Notification['type'], message: string, action?: AlertAction): void {
    const id = nextId++;
    this.notifications.update((list) => [...list, { id, type, message, action }]);
    setTimeout(() => this.dismiss(id), 3500);
  }
}
