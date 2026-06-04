import { Component, computed, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit, HostListener, ElementRef } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { VendorNotificationStateService } from '../../services/vendor-notification-state.service';
import { IVendorNotificationItem, NotificationIconType } from '../../interfaces';
import { NAV_ROUTES } from '../../../../core/constants';

@Component({
  selector: 'app-vendor-notification-bell',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './vendor-notification-bell.component.html',
  styleUrl: './vendor-notification-bell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorNotificationBellComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notificationState = inject(VendorNotificationStateService);
  private readonly elementRef = inject(ElementRef);

  readonly navRoutes = NAV_ROUTES;
  readonly unreadCount = this.notificationState.unreadCount;
  readonly notifications = computed(() => this.notificationState.notifications().slice(0, 5));
  readonly loading = signal(false);
  readonly markingAll = signal(false);
  readonly isOpen = signal(false);

  ngOnInit(): void {
    this.notificationState.loadUnreadCount()
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

    this.notificationState.markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.markingAll.set(false);
        },
        error: () => {
          this.markingAll.set(false);
        },
      });
  }

  viewAll(): void {
    this.closeDropdown();
    this.router.navigate([NAV_ROUTES.VENDOR_NOTIFICATIONS]);
  }

  protected iconClass(type: NotificationIconType): string {
    const map: Record<NotificationIconType, string> = {
      order: 'pi pi-shopping-cart',
      revenue: 'pi pi-credit-card',
      review: 'pi pi-star',
      alert: 'pi pi-exclamation-circle',
      system: 'pi pi-bell',
    };
    return map[type] ?? 'pi pi-bell';
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

    this.notificationState.loadNotifications(1, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  private loadNotificationsIfNeeded(): void {
    if (this.notifications().length === 0) {
      this.loadNotifications();
    }
  }
}
