import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { catchError, finalize, map, Observable, of, switchMap, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdersApiService } from './orders-api.service';
import { ProductCacheService } from '../../../core/services/product-cache.service';
import { IOrder, IOrderItem, OrderStatus } from '../interfaces';
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
  private productCache = inject(ProductCacheService);
  private destroyRef = inject(DestroyRef);

  readonly orders = signal<IOrder[] | null>(null);
  readonly selectedOrder = signal<IOrder | null>(null);

  readonly isLoadingList = signal(false);
  readonly isLoadingDetails = signal(false);
  readonly isCancelling = signal(false);
  readonly isSaving = signal(false);

  readonly listErrorKey = signal<string | null>(null);
  readonly detailsErrorKey = signal<string | null>(null);

  /**
   * Computed state: User can modify/cancel order only when status is 'pending'
   */
  readonly canModifyOrder = computed(() => {
    const order = this.selectedOrder();
    return order?.status === 'pending';
  });

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
    this.loadOrderDetails(id);
  }

  /**
   * Enriches order items with localized names and images from the Products API.
   * Uses ProductCacheService to avoid N+1 requests and deduplicate in-flight calls.
   */
  private enrichItems(items: IOrderItem[]): Observable<IOrderItem[]> {
    const productIds = items
      .map((item) => Number(item.productId))
      .filter((id) => !isNaN(id) && id > 0);

    if (productIds.length === 0) return of(items);

    return this.productCache.getProducts(productIds).pipe(
      map((products) => {
        const productMap = new Map(products.map((p: any) => [p.id, p]));
        return items.map((item) => {
          const product = productMap.get(Number(item.productId));
          if (!product) return item;
          return {
            ...item,
            productNameEn: product.nameEn || item.productName,
            productNameAr: product.nameAr || item.productName,
            productImage: product.mainImageUrl || item.productImage,
            workshopNameEn: product.workshopNameEn,
            workshopNameAr: product.workshopNameAr,
          };
        });
      })
    );
  }

  private enrichOrder(order: IOrder): Observable<IOrder> {
    const allItems: IOrderItem[] = [...order.items];
    if (order.vendorOrders) {
      order.vendorOrders.forEach((vo) => {
        allItems.push(...vo.items);
      });
    }
    return this.enrichItems(allItems).pipe(
      map((enrichedAllItems) => {
        let index = 0;
        const enrichedMainItems = enrichedAllItems.slice(0, order.items.length);
        index += order.items.length;

        const enrichedVendorOrders = order.vendorOrders?.map((vo) => {
          const voCount = vo.items.length;
          const enrichedVoItems = enrichedAllItems.slice(index, index + voCount);
          index += voCount;
          return { ...vo, items: enrichedVoItems };
        });

        return {
          ...order,
          items: enrichedMainItems,
          vendorOrders: enrichedVendorOrders,
        };
      })
    );
  }

  loadOrderDetails(id: string): void {
    this.isLoadingDetails.set(true);
    this.detailsErrorKey.set(null);

    this.api
      .getOrderById(id)
      .pipe(
        switchMap((order) => this.enrichOrder(order)),
        catchError(() => {
          this.detailsErrorKey.set('ORDERS_ERROR_LOAD_DETAILS');
          return of(null);
        }),
        finalize(() => this.isLoadingDetails.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (order) => {
          if (order) {
            console.log('Loaded & enriched order:', order);
            this.selectedOrder.set(order);
          }
        }
      });
  }

  /**
   * Cancels/deletes the order, updating the details and local list reactively.
   */
  cancelOrder(id: string): Observable<IOrder> {
    this.isCancelling.set(true);
    return this.api.updateOrderStatus(id, 'Cancelled').pipe(
      switchMap((updatedOrder) => this.enrichOrder(updatedOrder)),
      tap((enrichedOrder) => {
        this.selectedOrder.set(enrichedOrder);
        const currentOrders = this.orders();
        if (currentOrders) {
          this.orders.set(
            currentOrders.map((o) => (o.id === id ? enrichedOrder : o))
          );
        }
      }),
      finalize(() => this.isCancelling.set(false))
    );
  }

  /**
   * Updates items (quantities) on an existing pending order and updates local state.
   */
  updateOrderItems(id: string, items: { productId: number; quantity: number }[]): Observable<IOrder> {
    this.isSaving.set(true);
    return this.api.updateOrderItems(id, items).pipe(
      switchMap((updatedOrder) => this.enrichOrder(updatedOrder)),
      tap((enrichedOrder) => {
        this.selectedOrder.set(enrichedOrder);
        const currentOrders = this.orders();
        if (currentOrders) {
          this.orders.set(
            currentOrders.map((o) => (o.id === id ? enrichedOrder : o))
          );
        }
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  approveDeliveryDate(vendorOrderId: string): Observable<{ message: string }> {
    this.isSaving.set(true);
    return this.api.approveDeliveryDate(vendorOrderId).pipe(
      tap(() => {
        const selected = this.selectedOrder();
        if (selected) {
          this.loadOrderDetails(selected.id);
        }
      }),
      finalize(() => this.isSaving.set(false))
    );
  }

  rejectDeliveryDate(vendorOrderId: string): Observable<{ message: string }> {
    this.isSaving.set(true);
    return this.api.rejectDeliveryDate(vendorOrderId).pipe(
      tap(() => {
        const selected = this.selectedOrder();
        if (selected) {
          this.loadOrderDetails(selected.id);
        }
      }),
      finalize(() => this.isSaving.set(false))
    );
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
      status === 'pending' || status === 'awaiting_customer_approval' || status === 'confirmed'
        ? 'pending'
        : status === 'processing'
        ? 'processing'
        : status === 'shipped'
        ? 'shipped'
        : status === 'delivered'
        ? 'delivered'
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
      case 'awaiting_customer_approval':
        return 'warning';
      case 'confirmed':
        return 'info';
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
