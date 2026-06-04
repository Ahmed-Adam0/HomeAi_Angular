import { Component, computed, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit, HostListener, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { NotificationService } from '../../services/notification.service';
import { NAV_ROUTES } from '../../../../core/constants';

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
  private readonly notificationService = inject(NotificationService);
  private readonly elementRef = inject(ElementRef);

  readonly navRoutes = NAV_ROUTES;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly notifications = computed(() => this.notificationService.notifications().slice(0, 5));
  readonly loading = signal(false);
  readonly markingAll = signal(false);
  readonly isOpen = signal(false);

  ngOnInit(): void {
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
    this.loading.set(true);

    this.notificationService.loadNotifications(1, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.loading.set(false); },
        error: () => { this.loading.set(false); },
      });
  }

  private loadNotificationsIfNeeded(): void {
    if (this.notifications().length === 0) {
      this.loadNotifications();
    }
  }
}
