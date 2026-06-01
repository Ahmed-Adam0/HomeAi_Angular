import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { DatePipe } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { Button } from '../../../../shared/components/button/button.component';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import {
  NotificationCard,
  NotificationHeader,
  NotificationEmptyState,
} from '../../components';
import { VendorService } from '../../services/vendor.service';
import { IVendorNotificationItem } from '../../interfaces';
import { INotificationsMappedResult } from '../../data-access/mappers/vendor-notification.mapper';

@Component({
  selector: 'app-vendor-notifications',
  standalone: true,
  imports: [
    DatePipe,
    TranslatePipe,
    Button,
    PaginationComponent,
    SkeletonLoader,
    NotificationCard,
    NotificationHeader,
    NotificationEmptyState,
  ],
  templateUrl: './vendor-notifications.component.html',
  styleUrl: './vendor-notifications.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorNotifications implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly PAGE_SIZE = 10;

  /* ------------------------------------------------------------------
     Data signals
     ------------------------------------------------------------------ */

  readonly notifications = signal<IVendorNotificationItem[]>([]);
  readonly unreadCount = signal<number>(0);

  /* ------------------------------------------------------------------
     Loading signals
     ------------------------------------------------------------------ */

  readonly notificationsLoading = signal<boolean>(false);
  readonly unreadCountLoading = signal<boolean>(false);
  readonly markAsReadLoadingIds = signal<Set<number>>(new Set());
  readonly markAllLoading = signal<boolean>(false);

  /* ------------------------------------------------------------------
     Error signal
     ------------------------------------------------------------------ */

  readonly error = signal<string | null>(null);

  /* ------------------------------------------------------------------
     Filter signal
     ------------------------------------------------------------------ */

  readonly selectedFilter = signal<'all' | 'unread' | 'read'>('all');

  /* ------------------------------------------------------------------
     Pagination signal
     ------------------------------------------------------------------ */

  readonly pagination = signal<PaginationMeta>({
    pageNumber: 1,
    pageSize: this.PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasPreviousPage: false,
    hasNextPage: false,
  });

  /* ------------------------------------------------------------------
     Computed signals
     ------------------------------------------------------------------ */

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
  readonly unreadNotificationsCount = computed(
    () => this.notifications().filter((n) => !n.isRead).length,
  );
  readonly totalCount = computed(() => this.pagination().totalCount);
  readonly hasFilteredNotifications = computed(() => this.filteredNotifications().length > 0);
  readonly currentPage = computed(() => this.pagination().pageNumber);
  readonly totalPages = computed(() => this.pagination().totalPages);
  readonly isLastPage = computed(() => this.pagination().pageNumber >= this.pagination().totalPages);

  readonly showPagination = computed(
    () => this.pagination().totalPages > 1 && !this.notificationsLoading(),
  );

  readonly showSkeleton = computed(
    () => this.notificationsLoading() && !this.hasNotifications(),
  );

  readonly showContent = computed(
    () => !this.notificationsLoading() && !this.error() && this.hasNotifications(),
  );

  readonly showEmpty = computed(
    () =>
      !this.notificationsLoading() &&
      !this.error() &&
      this.hasNotifications() &&
      !this.hasFilteredNotifications(),
  );

  readonly showFullEmpty = computed(
    () => !this.notificationsLoading() && !this.error() && !this.hasNotifications(),
  );

  /* ------------------------------------------------------------------
     Lifecycle
     ------------------------------------------------------------------ */

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  /* ------------------------------------------------------------------
     Load methods
     ------------------------------------------------------------------ */

  private loadNotifications(): void {
    this.notificationsLoading.set(true);
    this.error.set(null);

    const { pageNumber, pageSize } = this.pagination();

    this.vendorService
      .getNotifications(pageNumber, pageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.notificationsLoading.set(false)),
      )
      .subscribe({
        next: (result: INotificationsMappedResult) => {
          this.notifications.set(result.items);
          this.pagination.set({
            pageNumber: result.pageNumber,
            pageSize: result.pageSize,
            totalCount: result.totalCount,
            totalPages: result.totalPages,
            hasPreviousPage: result.hasPreviousPage,
            hasNextPage: result.hasNextPage,
          });
        },
        error: (err: Error) => {
          this.error.set(err?.message ?? 'Failed to load notifications');
        },
      });
  }

  private loadUnreadCount(): void {
    this.unreadCountLoading.set(true);

    this.vendorService
      .getUnreadCount()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.unreadCountLoading.set(false)),
      )
      .subscribe({
        next: (count: number) => this.unreadCount.set(count),
      });
  }

  /* ------------------------------------------------------------------
     Mark single notification as read — optimistic with rollback
     ------------------------------------------------------------------ */

  onMarkAsRead(id: number): void {
    const previousNotifications = this.notifications();
    const previousUnreadCount = this.unreadCount();

    this.notifications.update((items) =>
      items.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    this.unreadCount.update((c) => Math.max(0, c - 1));
    this.markAsReadLoadingIds.update((ids) => new Set(ids).add(id));

    this.vendorService
      .markAsRead(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.markAsReadLoadingIds.update((ids) => {
            const next = new Set(ids);
            next.delete(id);
            return next;
          });
        }),
      )
      .subscribe({
        error: () => {
          this.notifications.set(previousNotifications);
          this.unreadCount.set(previousUnreadCount);
        },
      });
  }

  /* ------------------------------------------------------------------
     Mark all notifications as read — optimistic with rollback
     ------------------------------------------------------------------ */

  onMarkAllRead(): void {
    if (!this.hasUnread()) {
      return;
    }

    const previousNotifications = this.notifications();
    const previousUnreadCount = this.unreadCount();

    this.notifications.update((items) => items.map((n) => ({ ...n, isRead: true })));
    this.unreadCount.set(0);
    this.markAllLoading.set(true);

    this.vendorService
      .markAllAsRead()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.markAllLoading.set(false)),
      )
      .subscribe({
        error: () => {
          this.notifications.set(previousNotifications);
          this.unreadCount.set(previousUnreadCount);
        },
      });
  }

  /* ------------------------------------------------------------------
     Filter
     ------------------------------------------------------------------ */

  protected setFilter(filter: 'all' | 'unread' | 'read'): void {
    this.selectedFilter.set(filter);
  }

  /* ------------------------------------------------------------------
     Pagination
     ------------------------------------------------------------------ */

  protected onPageChange(page: number): void {
    this.pagination.update((p) => ({ ...p, pageNumber: page }));
    this.loadNotifications();
  }

  /* ------------------------------------------------------------------
     Refresh
     ------------------------------------------------------------------ */

  protected onRefresh(): void {
    this.pagination.update((p) => ({ ...p, pageNumber: 1 }));
    this.loadNotifications();
    this.loadUnreadCount();
  }
}

export interface PaginationMeta {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
