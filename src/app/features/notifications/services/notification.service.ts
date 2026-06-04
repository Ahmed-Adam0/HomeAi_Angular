import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError, tap, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { INotificationsResponseDto } from '../data-access/dto/notifications-response.dto';
import { IUnreadCountDto } from '../data-access/dto/unread-count.dto';
import { mapNotificationsResponse, INotificationsMappedResult } from '../data-access/mappers/notification.mapper';
import { INotificationItem } from '../interfaces/inotification';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly notificationsById = signal<Record<number, INotificationItem>>({});
  readonly currentPageNotifications = signal<INotificationItem[]>([]);
  readonly unreadCount = signal<number>(0);

  readonly notifications = computed(() =>
    Object.values(this.notificationsById())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
  );

  loadNotifications(page: number, pageSize: number): Observable<INotificationsMappedResult> {
    return this.http.get<INotificationsResponseDto>(
      `${this.apiUrl}${API_URLS.NOTIFICATIONS.LIST}`,
      { params: { page: page.toString(), pageSize: pageSize.toString() } },
    ).pipe(
      map((response) => mapNotificationsResponse(response)),
      tap((mapped) => {
        const mergedNotifications = mapped.items.map((item) => {
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
    return this.http.get<IUnreadCountDto>(
      `${this.apiUrl}${API_URLS.NOTIFICATIONS.UNREAD_COUNT}`,
    ).pipe(
      map((dto) => dto.unreadCount ?? 0),
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

    return this.http.put<void>(
      `${this.apiUrl}${API_URLS.NOTIFICATIONS.MARK_READ(notificationId)}`, null,
    ).pipe(
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

    return this.http.put<void>(
      `${this.apiUrl}${API_URLS.NOTIFICATIONS.MARK_ALL_READ}`, null,
    ).pipe(
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
        [notificationId]: { ...previous[notificationId], isRead },
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
      const next: Record<number, INotificationItem> = {};
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
