import { Component, computed, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit, HostListener, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { AuthService } from '../../../../features/auth/services/auth.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [DatePipe, TranslatePipe],
  templateUrl: './notification-bell.component.html',
  styleUrl: './notification-bell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  readonly notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);

  readonly navRoutes = NAV_ROUTES;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly unreadCountLoading = this.notificationService.unreadCountLoading;
  readonly notifications = computed(() => this.notificationService.notifications().slice(0, 5));
  readonly loading = this.notificationService.loading;
  readonly markingAll = signal(false);
  readonly markingIds = signal<Set<number>>(new Set());
  readonly isOpen = signal(false);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    this.notificationService.loadUnreadCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  toggleDropdown(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.update(v => !v);
    if (this.isOpen()) {
      this.loadNotificationsIfNeeded();
      if (window.innerWidth <= 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    document.body.style.overflow = '';
  }

  markAsRead(id: number): void {
    if (this.markingIds().has(id)) return;

    this.markingIds.update((ids) => new Set(ids).add(id));

    this.notificationService.markAsRead(id)
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

  markAllAsRead(): void {
    this.markingAll.set(true);

    this.notificationService.markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.markingAll.set(false); },
        error: () => { this.markingAll.set(false); },
      });
  }

  viewAll(): void {
    this.closeDropdown();
    this.router.navigate([NAV_ROUTES.NOTIFICATIONS]);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeDropdown();
  }

  @HostListener('document:mousedown', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.isOpen()) return;
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  private loadNotifications(): void {
    this.notificationService.loadNotifications(1, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  private loadNotificationsIfNeeded(): void {
    if (this.notifications().length === 0) {
      this.loadNotifications();
    }
  }
}
