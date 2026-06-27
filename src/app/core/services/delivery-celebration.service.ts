import { Injectable, inject, signal, PLATFORM_ID, DestroyRef, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { AuthService } from '../../features/auth/services/auth.service';
import { OrdersApiService } from '../../features/orders/data-access/orders-api.service';
import { NotificationHubService } from '../../features/notifications/services/notification-hub.service';
import { NotificationService } from '../../features/notifications/services/notification.service';
import { TranslationService } from '../../shared/i18n/translation.service';
import { IOrder } from '../../features/orders/interfaces';

/**
 * Global service that manages the delivery celebration modal lifecycle.
 * Monitors order delivery events via:
 *   1. Order list loading on authentication
 *   2. Real-time SignalR notifications
 *
 * Shows the celebration modal exactly once per delivered order,
 * regardless of which page the user is currently viewing.
 */
@Injectable({ providedIn: 'root' })
export class DeliveryCelebrationService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly hubService = inject(NotificationHubService);
  private readonly notificationService = inject(NotificationService);
  private readonly translationService = inject(TranslationService);

  /** Whether the celebration modal is currently visible */
  readonly isModalVisible = signal(false);

  /** The order ID of the delivered order being celebrated */
  readonly deliveredOrderId = signal<string | null>(null);

  /** The order number for display in the modal */
  readonly deliveredOrderNumber = signal<string | null>(null);

  /** Tracks whether an order scan is currently in-flight to avoid duplicate fetches */
  private scanInFlight = false;

  constructor() {
    if (!this.isBrowser) return;

    // When the user becomes authenticated, scan their orders for new deliveries
    effect(() => {
      if (this.authService.isAuthenticated()) {
        this.scanOrdersForDeliveries();
      }
    });

    // Listen for real-time SignalR notifications that might indicate a delivery
    this.hubService.newNotifications$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((notification) => {
        const text = `${notification.title} ${notification.message}`.toLowerCase();
        const isDeliveryNotification =
          text.includes('delivered') ||
          text.includes('تم التوصيل') ||
          text.includes('تم توصيل');

        if (isDeliveryNotification) {
          // A delivery event was received — re-scan orders to find the delivered one
          this.scanOrdersForDeliveries();
        }
      });
  }

  /**
   * Fetches the user's orders and scans them for newly delivered orders.
   */
  private scanOrdersForDeliveries(): void {
    if (!this.isBrowser || this.scanInFlight) return;
    this.scanInFlight = true;

    this.ordersApi
      .getMyOrders()
      .pipe(
        catchError(() => of([] as IOrder[])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (orders) => {
          this.scanInFlight = false;
          this.checkOrders(orders);
        },
        error: () => {
          this.scanInFlight = false;
        },
      });
  }

  /**
   * Scans a list of orders and triggers the modal for the first
   * un-shown delivered order.
   */
  checkOrders(orders: IOrder[]): void {
    if (!this.isBrowser) return;

    console.log('[DeliveryCelebration] checkOrders called with orders count:', orders.length);

    // Don't interrupt if a modal is already showing
    if (this.isModalVisible()) {
      console.log('[DeliveryCelebration] checkOrders: Modal is already visible. Returning.');
      return;
    }

    for (const order of orders) {
      const orderId = order.id;
      const modalKey = `delivery_modal_shown_${orderId}`;
      const hasKey = localStorage.getItem(modalKey);

      console.log(`[DeliveryCelebration] Checking Order #${order.orderNumber} (ID: ${orderId}), status: "${order.status}", modalKey: "${modalKey}", hasKeyInLocalStorage:`, hasKey);

      if (order.status !== 'delivered') {
        console.log(`[DeliveryCelebration] Skipping Order #${order.orderNumber}: status is not 'delivered'`);
        continue;
      }

      if (hasKey) {
        console.log(`[DeliveryCelebration] Skipping Order #${order.orderNumber}: already shown (flag exists)`);
        continue;
      }

      console.log(`[DeliveryCelebration] Found un-shown delivered order — showing modal for Order #${order.orderNumber}`);

      // Found an un-shown delivered order — show the modal
      this.deliveredOrderId.set(orderId);
      this.deliveredOrderNumber.set(order.orderNumber || '');
      this.isModalVisible.set(true);
      localStorage.setItem(modalKey, 'true');

      // Also add a notification entry (once per order)
      this.addDeliveryNotification(order);

      // Only show one modal at a time
      break;
    }
  }

  /**
   * Adds a local notification for the delivered order if not already added.
   */
  private addDeliveryNotification(order: IOrder): void {
    const notificationKey = `delivered_notification_added_${order.id}`;
    if (localStorage.getItem(notificationKey)) return;

    const orderNum = order.orderNumber || '';
    this.notificationService.addNotification({
      id: Math.floor(Math.random() * 1000000) + 9000000,
      title: this.translationService
        .translate('NOTIFICATION_ORDER_DELIVERED_TITLE')
        .replace('{{orderNumber}}', orderNum),
      message: this.translationService.translate('NOTIFICATION_ORDER_DELIVERED_DESC'),
      isRead: false,
      createdAt: new Date(),
      actionUrl: `/share-transformation?orderId=${order.id}`,
    });

    localStorage.setItem(notificationKey, 'true');
  }

  /**
   * Navigate to the share transformation page and close the modal.
   */
  navigateToShare(): void {
    const orderId = this.deliveredOrderId();
    this.isModalVisible.set(false);
    if (orderId) {
      this.router.navigate(['/share-transformation'], { queryParams: { orderId } });
    }
  }

  /**
   * Dismiss the modal without navigating (Maybe Later).
   */
  dismissModal(): void {
    this.isModalVisible.set(false);
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
