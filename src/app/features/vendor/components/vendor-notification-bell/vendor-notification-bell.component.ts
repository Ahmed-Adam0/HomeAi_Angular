import { Component, inject, signal, ChangeDetectionStrategy, DestroyRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Popover } from 'primeng/popover';
import { VendorService } from '../../services/vendor.service';
import { IVendorNotificationItem, NotificationIconType } from '../../interfaces';
import { NAV_ROUTES } from '../../../../core/constants';

@Component({
  selector: 'app-vendor-notification-bell',
  standalone: true,
  imports: [Popover, DatePipe],
  templateUrl: './vendor-notification-bell.component.html',
  styleUrl: './vendor-notification-bell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorNotificationBellComponent implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly navRoutes = NAV_ROUTES;
  readonly unreadCount = signal(0);
  readonly notifications = signal<IVendorNotificationItem[]>([]);
  readonly loading = signal(false);
  readonly markingAll = signal(false);

  ngOnInit(): void {
    this.refreshUnreadCount();
  }

  onPopoverShow(): void {
    this.loadNotifications();
  }

  markAllAsRead(): void {
    this.markingAll.set(true);
    this.vendorService.markAllAsRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.unreadCount.set(0);
        this.notifications.update(items => items.map(n => ({ ...n, isRead: true })));
        this.markingAll.set(false);
      });
  }

  viewAll(): void {
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

  private refreshUnreadCount(): void {
    this.vendorService.getUnreadCount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(count => this.unreadCount.set(count));
  }

  private loadNotifications(): void {
    this.loading.set(true);
    this.vendorService.getNotifications(1, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.notifications.set(result.items);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
