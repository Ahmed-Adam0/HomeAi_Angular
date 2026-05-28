import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdersApiService } from './orders-api.service';
import { IOrder, OrderStatus } from '../interfaces';
import { StatusBadgeTone } from '../../../shared/components/status-badge/status-badge.component';

export type PaymentStatus = IOrder['paymentStatus'];

export interface OrderListItemVm {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}

export interface TimelineStepVm {
  key: 'pending' | 'processing' | 'shipped' | 'delivered';
  isComplete: boolean;
  isActive: boolean;
}

@Injectable()
export class OrdersFacade {
  private api = inject(OrdersApiService);
  private destroyRef = inject(DestroyRef);

  readonly orders = signal<IOrder[] | null>(null);
  readonly selectedOrder = signal<IOrder | null>(null);

  readonly isLoadingList = signal(false);
  readonly isLoadingDetails = signal(false);

  readonly listErrorKey = signal<string | null>(null);
  readonly detailsErrorKey = signal<string | null>(null);

  /**
   * Reactive View Model for the Orders List.
   * Emits sorted list of orders by creation date (newest first).
   */
  readonly orderListVm = computed<OrderListItemVm[]>(() => {
    const orders = this.orders();
    if (!orders) return [];
    return orders
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        totalAmount: o.totalAmount,
        orderStatus: o.status,
        paymentStatus: o.paymentStatus,
      }));
  });

  /**
   * Expose computed totals for the selected order.
   */
  readonly selectedOrderSubtotal = computed(() => {
    const order = this.selectedOrder();
    if (!order) return 0;
    return order.totalAmount - order.shippingCost - order.taxAmount + order.discountAmount;
  });

  /**
   * Fetches user's orders from the backend API.
   */
  loadOrders(): void {
    this.isLoadingList.set(true);
    this.listErrorKey.set(null);

    this.api
      .getMyOrders()
      .pipe(
        catchError(() => {
          this.listErrorKey.set('ORDERS_ERROR_LOAD_LIST');
          return of([] as IOrder[]);
        }),
        finalize(() => this.isLoadingList.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((orders) => this.orders.set(orders));
  }

  /**
   * Fetches detailed information for a single order.
   */
  loadOrder(id: string): void {
    this.isLoadingDetails.set(true);
    this.detailsErrorKey.set(null);

    this.api
      .getOrderById(id)
      .pipe(
        catchError(() => {
          this.detailsErrorKey.set('ORDERS_ERROR_LOAD_DETAILS');
          return of(null);
        }),
        finalize(() => this.isLoadingDetails.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((order) => this.selectedOrder.set(order));
  }

  /**
   * Handles route param subscription to load order details dynamically.
   */
  connectDetailsRoute(route: ActivatedRoute): void {
    route.paramMap
      .pipe(
        map((pm: ParamMap) => pm.get('id')),
        switchMap((id) => {
          if (!id) return of(null);
          this.loadOrder(id);
          return of(id);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Generates step view models for the status timeline component.
   */
  timelineFor(status: OrderStatus): TimelineStepVm[] {
    const sequence: TimelineStepVm['key'][] = ['pending', 'processing', 'shipped', 'delivered'];

    const normalized: TimelineStepVm['key'] =
      status === 'pending' || status === 'processing' || status === 'shipped' || status === 'delivered'
        ? status
        : 'pending';

    const activeIndex = sequence.indexOf(normalized);

    return sequence.map((key, idx) => ({
      key,
      isComplete: idx < activeIndex,
      isActive: idx === activeIndex,
    }));
  }

  /**
   * Centralized Business Logic: Order status badge tone mapping.
   * Pending -> warning
   * Processing -> info
   * Shipped -> primary (brand)
   * Delivered -> success
   * Cancelled -> danger
   */
  orderStatusTone(status: OrderStatus): StatusBadgeTone {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'brand'; // primary brand color
      case 'delivered':
        return 'success';
      case 'cancelled':
      case 'refunded':
        return 'danger';
      default:
        return 'neutral';
    }
  }

  /**
   * Centralized Business Logic: Payment status badge tone mapping.
   */
  paymentStatusTone(status: PaymentStatus): StatusBadgeTone {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'refunded':
        return 'info';
      default:
        return 'neutral';
    }
  }
}
