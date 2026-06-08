import { Injectable, computed, DestroyRef, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { catchError, Observable, throwError, tap, map, timer, Subject, switchMap, of, finalize, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { API_URLS, LOCAL_STORAGE_KEYS } from '../../../core/constants';
import { PaginatedResponse } from '../data-access/dto/notifications-response.dto';
import { UnreadCount } from '../data-access/dto/unread-count.dto';
import { mapNotificationsResponse, NotificationsMappedResult } from '../data-access/mappers/notification.mapper';
import { INotificationItem } from '../interfaces/inotification';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly authService = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private unreadCountRequest: Observable<number> | null = null;
  private unreadCountLoaded = false;
  private readonly notificationsById = signal<Record<number, INotificationItem>>({});
  readonly currentPageNotifications = signal<INotificationItem[]>([]);
  readonly notifications = signal<INotificationItem[]>([]);
  readonly unreadCount = signal<number>(0);
  readonly loading = signal(false);
  readonly unreadCountLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly unreadCountError = signal<string | null>(null);

  private errorCooldownMs = 5000;
  private lastErrorTime = 0;

  readonly unreadCountFromNotifications = computed(() =>
    this.notifications().filter((notification) => !notification.isRead).length,
  );

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.ensureUnreadCountLoaded()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => { /* loaded */ },
            error: () => { /* errors are tracked inside service */ },
          });
      } else {
        this.unreadCountLoaded = false;
        this.unreadCount.set(0);
      }
    });
  }

  private setError(message: string): void {
    const now = Date.now();
    if (now - this.lastErrorTime < this.errorCooldownMs) return;
    this.lastErrorTime = now;
    this.error.set(message);
  }

  loadNotifications(page: number, pageSize: number): Observable<NotificationsMappedResult> {
    const hasSession = this.isBrowser && !!localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (!this.authService.isLoggedIn() || !hasSession) {
      this.loading.set(false);
      this.error.set(null);
      this.currentPageNotifications.set([]);
      this.notifications.set([]);
      this.unreadCount.set(0);
      return of({
        items: [],
        totalCount: 0,
        totalPages: 0,
        pageNumber: page,
        pageSize,
        hasPreviousPage: false,
        hasNextPage: false,
      });
    }

    this.loading.set(true);
    this.error.set(null);

    return this.http.get<PaginatedResponse>(
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
        this.syncNotificationSignals();
        this.loading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.loading.set(false);
        this.setError(this.parseHttpError(err));
        return throwError(() => err);
      }),
    );
  }

  ensureUnreadCountLoaded(): Observable<number> {
    const hasSession = this.isBrowser && !!localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (!this.authService.isLoggedIn() || !hasSession) {
      this.unreadCount.set(0);
      this.unreadCountLoading.set(false);
      this.unreadCountError.set(null);
      this.unreadCountLoaded = false;
      return of(0);
    }

    if (this.unreadCountLoaded) {
      return of(this.unreadCount());
    }

    if (this.unreadCountRequest) {
      return this.unreadCountRequest;
    }

    this.unreadCountRequest = this.loadUnreadCount().pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
      finalize(() => { this.unreadCountRequest = null; }),
    );

    return this.unreadCountRequest;
  }

  loadUnreadCount(): Observable<number> {
    const hasSession = this.isBrowser && !!localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);

    if (!this.authService.isLoggedIn() || !hasSession) {
      this.unreadCount.set(0);
      this.unreadCountLoading.set(false);
      this.unreadCountError.set(null);
      this.unreadCountLoaded = false;
      return of(0);
    }

    this.unreadCountLoading.set(true);
    this.unreadCountError.set(null);

    return this.http.get<UnreadCount>(
      `${this.apiUrl}${API_URLS.NOTIFICATIONS.UNREAD_COUNT}`,
    ).pipe(
      map((dto) => dto.unreadCount ?? 0),
      tap((count) => {
        this.unreadCount.set(count);
        this.unreadCountLoaded = true;
        this.unreadCountLoading.set(false);
      }),
      catchError((err: HttpErrorResponse) => {
        this.unreadCountLoading.set(false);
        this.unreadCountError.set(this.parseHttpError(err));
        return throwError(() => err);
      }),
    );
  }

  addNotification(notification: INotificationItem): void {
    const normalizedNotification: INotificationItem = {
      ...notification,
      createdAt: notification.createdAt instanceof Date ? notification.createdAt : new Date(notification.createdAt),
    };

    this.notificationsById.update((previous) => ({
      [normalizedNotification.id]: normalizedNotification,
      ...previous,
    }));

    this.currentPageNotifications.update((items) => [
      normalizedNotification,
      ...items.filter((item) => item.id !== normalizedNotification.id),
    ]);

    this.syncNotificationSignals();
    this.unreadCount.update((count) => count + (normalizedNotification.isRead ? 0 : 1));
  }

  refreshNotifications(page = 1, pageSize = 5): Observable<NotificationsMappedResult> {
    return this.loadNotifications(page, pageSize);
  }

  markAsRead(notificationId: number): Observable<void> {
    const previousNotifications = this.notificationsById();
    const previousPageNotifications = this.currentPageNotifications();
    const previousUnreadCount = this.unreadCount();

    this.applyReadState(notificationId, true);
    this.syncNotificationSignals();
    this.unreadCount.update((count) => Math.max(0, count - 1));

    return this.http.put<void>(
      `${this.apiUrl}${API_URLS.NOTIFICATIONS.MARK_READ(notificationId)}`, null,
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.notificationsById.set(previousNotifications);
        this.currentPageNotifications.set(previousPageNotifications);
        this.unreadCount.set(previousUnreadCount);
        this.setError(this.parseHttpError(error));
        return throwError(() => error);
      }),
    );
  }

  markAllAsRead(): Observable<void> {
    const previousNotifications = this.notificationsById();
    const previousPageNotifications = this.currentPageNotifications();
    const previousUnreadCount = this.unreadCount();

    this.applyReadStateToAll(true);
    this.syncNotificationSignals();
    this.unreadCount.set(0);

    return this.http.put<void>(
      `${this.apiUrl}${API_URLS.NOTIFICATIONS.MARK_ALL_READ}`, null,
    ).pipe(
      catchError((error: HttpErrorResponse) => {
        this.notificationsById.set(previousNotifications);
        this.currentPageNotifications.set(previousPageNotifications);
        this.unreadCount.set(previousUnreadCount);
        this.setError(this.parseHttpError(error));
        return throwError(() => error);
      }),
    );
  }

  private syncNotificationSignals(): void {
    const sortedNotifications = Object.values(this.notificationsById())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    this.notifications.set(sortedNotifications);
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

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private parseHttpError(err: HttpErrorResponse): string {
    if (err.status === 401 || err.status === 403) {
      return 'Your session has expired. Please log in again.';
    }
    if (err.status === 404) {
      return 'The requested resource was not found.';
    }
    if (err.status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    return err.message || 'An unexpected error occurred.';
  }
}
