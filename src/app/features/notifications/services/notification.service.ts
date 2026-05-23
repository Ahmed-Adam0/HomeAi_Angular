import { Injectable, signal, computed } from '@angular/core';
import { INotification } from '../interfaces/inotification';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private initialNotifications: INotification[] = [
    { id: '1', title: 'Order Dispatched', message: 'Your Minimalist Oak Chair order has been dispatched.', type: 'success', read: false, createdAt: new Date() },
    { id: '2', title: 'New Category Added', message: 'Browse our brand new Office Workspace collection!', type: 'info', read: false, createdAt: new Date(Date.now() - 3600000) },
    { id: '3', title: 'Payment Authorized', message: 'Transaction for order #ORD_8A2B9X was successful.', type: 'success', read: true, createdAt: new Date(Date.now() - 86400000) }
  ];

  readonly notifications = signal<INotification[]>(this.initialNotifications);

  readonly unreadCount = computed(() => {
    return this.notifications().filter((n) => !n.read).length;
  });

  getNotifications(): Observable<INotification[]> {
    return of(this.notifications());
  }

  markAsRead(id: string): void {
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  clearAll(): void {
    this.notifications.set([]);
  }
}
