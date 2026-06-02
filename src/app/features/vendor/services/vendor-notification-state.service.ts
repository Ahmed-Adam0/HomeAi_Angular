import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, Observable, throwError, tap } from 'rxjs';
import { VendorService } from './vendor.service';
import { INotificationsMappedResult } from '../data-access/mappers/vendor-notification.mapper';
import { IVendorNotificationItem } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class VendorNotificationStateService {
  private readonly vendorService = inject(VendorService);

  private readonly notificationsById = signal<Record<number, IVendorNotificationItem>>({});
  readonly currentPageNotifications = signal<IVendorNotificationItem[]>([]);
  readonly unreadCount = signal<number>(0);

  readonly notifications = computed(() =>
    Object.values(this.notificationsById())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );

  loadNotifications(page: number, pageSize: number): Observable<INotificationsMappedResult> {
    return this.vendorService.getNotifications(page, pageSize).pipe(
      tap((result) => {
        const mergedNotifications = result.items.map((item) => {
          const existing = this.notificationsById()[item.id];
          return existing ? { ...item, isRead: existing.isRead } : item;
        });

        this.currentPageNotifications.set(mergedNotifications);
        this.notificationsById.update((previous) => {
          const next = { ...previous };
          mergedNotifications.forEach((item) => {
            next[item.id] = item;
          });
          return next;
        });
      }),
    );
  }

  loadUnreadCount(): Observable<number> {
    return this.vendorService.getUnreadCount().pipe(
      tap((count) => {
        this.unreadCount.set(count);
      }),
    );
  }

  markAsRead(notificationId: number): Observable<void> {
    const previousNotifications = this.notificationsById();
    const previousPageNotifications = this.currentPageNotifications();
    const previousUnreadCount = this.unreadCount();

    this.applyReadState(notificationId, true);
    this.unreadCount.update((count) => Math.max(0, count - 1));

    return this.vendorService.markAsRead(notificationId).pipe(
      catchError((error) => {
        this.notificationsById.set(previousNotifications);
        this.currentPageNotifications.set(previousPageNotifications);
        this.unreadCount.set(previousUnreadCount);
        return throwError(() => error);
      }),
    );
  }

  markAllAsRead(): Observable<void> {
    const previousNotifications = this.notificationsById();
    const previousPageNotifications = this.currentPageNotifications();
    const previousUnreadCount = this.unreadCount();

    this.applyReadStateToAll(true);
    this.unreadCount.set(0);

    return this.vendorService.markAllAsRead().pipe(
      catchError((error) => {
        this.notificationsById.set(previousNotifications);
        this.currentPageNotifications.set(previousPageNotifications);
        this.unreadCount.set(previousUnreadCount);
        return throwError(() => error);
      }),
    );
  }

  private applyReadState(notificationId: number, isRead: boolean): void {
    this.notificationsById.update((previous) => {
      if (!previous[notificationId]) {
        return previous;
      }

      return {
        ...previous,
        [notificationId]: {
          ...previous[notificationId],
          isRead,
        },
      };
    });

    this.currentPageNotifications.update((items) =>
      items.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead }
          : notification,
      ),
    );
  }

  private applyReadStateToAll(isRead: boolean): void {
    this.notificationsById.update((previous) => {
      const next: Record<number, IVendorNotificationItem> = {};
      Object.entries(previous).forEach(([key, notification]) => {
        next[Number(key)] = { ...notification, isRead };
      });
      return next;
    });

    this.currentPageNotifications.update((items) =>
      items.map((notification) => ({ ...notification, isRead })),
    );
  }
}
