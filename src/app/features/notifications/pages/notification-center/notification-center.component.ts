import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, finalize } from 'rxjs';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { NotificationTitlePipe, NotificationMessagePipe } from '../../../../shared/pipes/notification-translation.pipe';
import { NotificationService } from '../../services/notification.service';
import { NotificationHubService } from '../../services/notification-hub.service';
import { NotificationsMappedResult } from '../../data-access/mappers/notification.mapper';
import { INotificationItem } from '../../interfaces/inotification';

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

@Component({
  selector: 'app-notification-center-page',
  standalone: true,
  imports: [DatePipe, TranslatePipe, NotificationTitlePipe, NotificationMessagePipe],
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationCenterComponent implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly hubService = inject(NotificationHubService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly PAGE_SIZE = 10;

  readonly notifications = computed(() => this.notificationService.currentPageNotifications());
  readonly unreadCount = this.notificationService.unreadCount;
  readonly notificationsLoading = this.notificationService.loading;
  readonly markAllLoading = signal<boolean>(false);
  readonly markingIds = signal<Set<number>>(new Set());

  readonly selectedFilter = signal<'all' | 'unread' | 'read'>('all');

  readonly pagination = signal<PaginationMeta>({
    pageNumber: 1,
    pageSize: this.PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  readonly filteredNotifications = computed(() => {
    const filter = this.selectedFilter();
    const items = this.notifications();
    if (filter === 'unread') return items.filter((n) => !n.isRead);
    if (filter === 'read') return items.filter((n) => n.isRead);
    return items;
  });

  readonly hasNotifications = computed(() => this.notifications().length > 0);
  readonly hasUnread = computed(() => this.unreadCount() > 0);
  readonly readCount = computed(() => this.notifications().filter((n) => n.isRead).length);
  readonly totalCount = computed(() => this.pagination().totalCount);
  readonly hasFilteredNotifications = computed(() => this.filteredNotifications().length > 0);
  readonly currentPage = computed(() => this.pagination().pageNumber);
  readonly totalPages = computed(() => this.pagination().totalPages);

  readonly showPagination = computed(
    () => this.pagination().totalPages > 1 && !this.notificationsLoading(),
  );

  readonly showSkeleton = computed(
    () => this.notificationsLoading() && !this.hasNotifications(),
  );

  readonly showContent = computed(
    () => !this.notificationsLoading() && !this.notificationService.error() && this.hasNotifications(),
  );

  readonly showEmpty = computed(
    () =>
      !this.notificationsLoading() &&
      !this.notificationService.error() &&
      this.hasNotifications() &&
      !this.hasFilteredNotifications(),
  );

  readonly showFullEmpty = computed(
    () => !this.notificationsLoading() && !this.notificationService.error() && !this.hasNotifications(),
  );

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();

    this.hubService.newNotifications$
      .pipe(
        debounceTime(300),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.pagination.update((p) => ({ ...p, totalCount: p.totalCount + 1 }));
        this.loadUnreadCount();
      });
  }

  private loadNotifications(): void {
    this.notificationService.error.set(null);

    const { pageNumber, pageSize } = this.pagination();

    this.notificationService
      .loadNotifications(pageNumber, pageSize)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result: NotificationsMappedResult) => {
          this.pagination.set({
            pageNumber: result.pageNumber,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: result.totalPages,
            hasPreviousPage: result.hasPreviousPage,
            hasNextPage: result.hasNextPage,
          });
        },
      });
  }

  private loadUnreadCount(): void {
    this.notificationService
      .ensureUnreadCountLoaded()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onNotificationClick(notif: INotificationItem): void {
    this.onMarkAsRead(notif.id);
    if (notif.actionUrl) {
      this.router.navigateByUrl(notif.actionUrl);
    }
  }

  onMarkAsRead(id: number): void {
    if (!id || id <= 0) return;
    if (this.markingIds().has(id)) return;

    this.markingIds.update((ids) => new Set(ids).add(id));

    this.notificationService
      .markAsRead(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.markingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(id);
            return next;
          });
        },
        error: () => {
          this.markingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(id);
            return next;
          });
        },
      });
  }

  onMarkAllRead(): void {
    if (!this.hasUnread()) return;

    this.markAllLoading.set(true);

    this.notificationService
      .markAllAsRead()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.markAllLoading.set(false)),
      )
      .subscribe();
  }

  setFilter(filter: 'all' | 'unread' | 'read'): void {
    this.selectedFilter.set(filter);
  }

  onPageChange(page: number): void {
    this.pagination.update((p) => ({ ...p, pageNumber: page }));
    this.loadNotifications();
  }

  onRefresh(): void {
    this.notificationService.error.set(null);
    this.pagination.update((p) => ({ ...p, pageNumber: 1 }));
    this.loadNotifications();
    this.loadUnreadCount();
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
