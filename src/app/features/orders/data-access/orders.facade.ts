import { DestroyRef, computed, inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { catchError, finalize, forkJoin, map, Observable, of, retry, switchMap, tap, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OrdersApiService } from './orders-api.service';
import { ProductCacheService } from '../../../core/services/product-cache.service';
import { IOrder, IOrderItem, OrderStatus } from '../interfaces';
import { StatusBadgeTone } from '../../../shared/components/status-badge/status-badge.component';
import { LoadingService } from '../../../core/services/loading.service';
import { PaymentService } from '../../payment/services/payment.service';
import { UiState } from '../../../core/state/ui.state';
import { TranslationService } from '../../../shared/i18n/translation.service';

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
  key: OrderStatus;
  isComplete: boolean;
  isActive: boolean;
}

@Injectable()
export class OrdersFacade {
  private api = inject(OrdersApiService);
  private productCache = inject(ProductCacheService);
  private destroyRef = inject(DestroyRef);
  private loadingService = inject(LoadingService);
  private paymentService = inject(PaymentService);
  private uiState = inject(UiState);
  readonly translationService = inject(TranslationService);
  private router = inject(Router);

  readonly orders = signal<IOrder[] | null>(null);
  readonly selectedOrder = signal<IOrder | null>(null);

  readonly isLoadingList = signal(false);
  readonly isLoadingDetails = signal(false);
  readonly isCancelling = signal(false);
  readonly isSaving = signal(false);

  readonly listErrorKey = signal<string | null>(null);
  readonly detailsErrorKey = signal<string | null>(null);

  // Remaining balance signals
  readonly remainingBalanceDetails = signal<any | null>(null);
  readonly isLoadingBreakdown = signal<boolean>(false);
  readonly isInitiatingPayment = signal<boolean>(false);
  readonly isInitiatingVendorPayment = signal<Record<string, boolean>>({});

  private readonly ACTIVE_VO_STATUSES = new Set([
    'confirmed',                  // Confirmed
    'in_progress',                // InProgress
    'pending_payment',            // PendingPayment
    'shipped',                    // Shipped
    'delivered',                  // Delivered
  ]);

  /**
   * Helper to normalize statuses to snake_case for consistency
   */
  normalizeStatusSnake(value: string | undefined | null): string {
    if (!value) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s_-]+/g, '_')
      .toLowerCase();
  }

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
        orderStatus: this.displayStatusFor(o),
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
   * Compute total of active vendor orders.
   */
  readonly activeVendorOrdersTotal = computed(() => {
    const vOrders = this.selectedOrder()?.vendorOrders ?? [];
    return vOrders
      .filter(vo => this.ACTIVE_VO_STATUSES.has(this.normalizeStatusSnake(vo.status)))
      .reduce((sum, vo) => sum + (vo.totalPrice ?? 0), 0);
  });

  /**
   * Compute total amount paid so far.
   */
  readonly amountPaid = computed(() => {
    const breakdown = this.remainingBalanceDetails();
    if (breakdown) {
      return breakdown.totalPrice - breakdown.remainingBalance;
    }
    const data = this.selectedOrder();
    if (!data) return 0;
    return (data.paymentStatus === 'Paid' || data.paymentStatus === 'paid') ? data.totalAmount : 0;
  });

  /**
   * Compute amount left to pay before order is fully paid.
   */
  readonly amountToPay = computed(() => {
    return Math.max(0, this.activeVendorOrdersTotal() - this.amountPaid());
  });

  /**
   * Derive payment status dynamically from calculations.
   */
  readonly calculatedPaymentStatus = computed(() => {
    const total = this.activeVendorOrdersTotal();
    const paid = this.amountPaid();
    
    if (total === 0) {
      return this.selectedOrder()?.paymentStatus || 'Unpaid';
    }
    
    if (paid >= total) {
      return 'Paid';
    }
    if (paid === 0) {
      return 'Unpaid';
    }
    return 'PartialPaid';
  });

  /**
   * Sum of milestones that are currently due.
   */
  readonly pendingPaymentTotal = computed(() => {
    const breakdown = this.remainingBalanceDetails();
    if (!breakdown || !breakdown.milestones) return 0;

    const vOrders = this.selectedOrder()?.vendorOrders ?? [];
    return breakdown.milestones
      .filter((m: any) => {
        if (m.isPaid) return false;
        const vo = vOrders.find(o => o.id === m.vendorOrderId.toString());
        if (!vo) return false;
        return this.normalizeStatusSnake(m.milestoneStatus) === vo.status &&
          (vo.status === 'pending_payment' || vo.status === 'shipped' || vo.status === 'delivered');
      })
      .reduce((sum: number, m: any) => sum + m.amount, 0);
  });

  /**
   * Total Order Value from order details or breakdown.
   */
  readonly totalOrderAmount = computed(() => {
    return this.selectedOrder()?.totalAmount || this.remainingBalanceDetails()?.totalPrice || 0;
  });

  /**
   * Dynamic remaining balance of the order.
   */
  readonly remainingBalance = computed(() => {
    const total = this.totalOrderAmount();
    const paid = this.amountPaid();
    return Math.max(0, total - paid);
  });

  /**
   * Progress percentage of payment.
   */
  readonly paymentProgress = computed(() => {
    const total = this.totalOrderAmount();
    if (total <= 0) return 0;
    const paid = this.amountPaid();
    return Math.min(100, Math.max(0, (paid / total) * 100));
  });

  /**
   * Enriched milestones list with states.
   */
  readonly enrichedMilestones = computed(() => {
    const breakdown = this.remainingBalanceDetails();
    if (!breakdown || !breakdown.milestones) return [];

    const vOrders = this.selectedOrder()?.vendorOrders ?? [];
    return breakdown.milestones.map((m: any) => {
      const vo = vOrders.find(o => o.id === m.vendorOrderId.toString());
      const state = this.getMilestoneState(m, vo);
      return {
        ...m,
        state,
        vendorOrder: vo
      };
    });
  });

  /**
   * Next Required Payment (first unpaid milestone)
   */
  readonly nextRequiredPayment = computed(() => {
    const milestones = this.enrichedMilestones();
    return milestones.find((m: any) => !m.isPaid) || null;
  });

  /**
   * Returns state of milestone: Paid, Processing, Failed, Pending, Upcoming.
   */
  getMilestoneState(m: any, vo: any): 'Paid' | 'Processing' | 'Failed' | 'Pending' | 'Upcoming' {
    if (m.isPaid) return 'Paid';
    if (!vo) return 'Upcoming';

    const currentStatus = this.normalizeStatusSnake(vo.status);
    const mStatus = this.normalizeStatusSnake(m.milestoneStatus);

    const statusOrder = ['pending_payment', 'shipped', 'delivered'];
    const currentIdx = statusOrder.indexOf(currentStatus);
    const milestoneIdx = statusOrder.indexOf(mStatus);

    if (currentIdx === -1 || milestoneIdx === -1) {
      return 'Pending';
    }

    if (currentIdx === milestoneIdx) {
      const paymentStatus = (this.selectedOrder()?.paymentStatus || '').toLowerCase();
      if (paymentStatus === 'failed') {
        return 'Failed';
      }
      if (paymentStatus === 'processing' || paymentStatus === 'pending') {
        return 'Processing';
      }
      return 'Pending';
    }

    if (currentIdx < milestoneIdx) {
      return 'Upcoming';
    }

    return 'Pending';
  }

  readonly hasPendingPaymentOrders = computed(() => {
    return this.pendingPaymentTotal() > 0 || this.activeVendorOrdersTotal() > 0;
  });

  /**
   * Fetches user's orders from the backend API.
   */
  loadOrders(): void {
    const done = this.loadingService.addInitTask();
    this.isLoadingList.set(true);
    this.listErrorKey.set(null);

    this.api
      .getMyOrders()
      .pipe(
        catchError(() => {
          this.listErrorKey.set('ORDERS_ERROR_LOAD_LIST');
          return of([] as IOrder[]);
        }),
        finalize(() => {
          this.isLoadingList.set(false);
          done();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((orders) => this.orders.set(orders));
  }

  loadOrder(id: string, waitForPayment: boolean = false): void {
    this.loadOrderDetails(id, waitForPayment);
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

  loadOrderDetails(id: string | number, waitForPayment: boolean = false): void {
    const stringId = id.toString();
    const dbOrderId = stringId.split('_')[0];

    const done = this.loadingService.addInitTask();
    this.isLoadingDetails.set(true);
    this.detailsErrorKey.set(null);

    forkJoin({
      order: this.api.getOrderById(dbOrderId).pipe(
        switchMap((order) => this.enrichOrder(order)),
        map((order) => {
          if (waitForPayment && (order.paymentStatus === 'Unpaid' || order.paymentStatus === 'unpaid' || order.paymentStatus === 'pending')) {
            throw new Error('Payment status not updated yet');
          }
          return order;
        })
      ),
      balance: this.paymentService.getMasterOrderRemainingBalance(dbOrderId).pipe(
        catchError((err) => {
          console.error('Failed to load balance breakdown:', err);
          return of(null);
        })
      )
    })
      .pipe(
        retry({
          count: 4,
          delay: (error, retryCount) => {
            const delayTime = Math.pow(2, retryCount) * 1000;
            console.warn(`[OrdersFacade] Order state not confirmed or fetch failed. Retrying in ${delayTime}ms (Attempt ${retryCount}/4) due to: ${error.message || error}`);
            return timer(delayTime);
          }
        }),
        catchError((err) => {
          console.error('Failed to load order details after retries:', err);
          this.detailsErrorKey.set('ORDERS_ERROR_LOAD_DETAILS');
          return of(null);
        }),
        finalize(() => {
          this.isLoadingDetails.set(false);
          done();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (result) => {
          if (result) {
            console.log('Loaded & enriched order with balance:', result);
            this.selectedOrder.set(result.order);
            this.remainingBalanceDetails.set(result.balance);
          }
        }
      });
  }

  loadRemainingBalance(orderId: string | number): void {
    const stringId = orderId.toString();
    const dbOrderId = stringId.split('_')[0];
    this.isLoadingBreakdown.set(true);
    this.paymentService.getMasterOrderRemainingBalance(dbOrderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (breakdown) => {
          this.remainingBalanceDetails.set(breakdown);
          this.isLoadingBreakdown.set(false);
        },
        error: (err) => {
          console.error('Failed to load payment breakdown:', err);
          this.isLoadingBreakdown.set(false);
        }
      });
  }

  payApprovedOrders(): void {
    const orderData = this.selectedOrder();
    if (!orderData) return;

    if (this.amountToPay() <= 0) {
      this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_NO_APPROVED_ORDERS_ERROR') || 'No approved orders to pay');
      return;
    }

    if (!orderData.id) return;

    const payload = {
      masterOrderId: Number(orderData.id)
    };

    this.isInitiatingPayment.set(true);
    this.paymentService.initiateMasterOrderPayment(payload).subscribe({
      next: (res) => {
        if (res && res.paymentUrl) {
          this.paymentService.startPaymentFlow(res.paymentUrl, Number(orderData.id)).subscribe({
            next: (paymentRes) => {
              this.isInitiatingPayment.set(false);
              if (paymentRes.success) {
                this.uiState.showAlert('success', this.translationService.translate('ORDER_DETAILS_PAYMENT_SUCCESS') || 'Payment completed successfully');
                this.loadOrderDetails(orderData.id);
              } else {
                this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_PAYMENT_FAILED') || 'Payment was unsuccessful or cancelled');
              }
            },
            error: () => {
              this.isInitiatingPayment.set(false);
            }
          });
        } else {
          this.isInitiatingPayment.set(false);
          this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR') || 'Failed to initiate payment');
        }
      },
      error: (err) => {
        this.isInitiatingPayment.set(false);
        console.error('Failed to initiate master order payment:', err);
        this.uiState.showAlert('danger', err.error?.message || this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR') || 'Failed to initiate payment');
      }
    });
  }

  payVendorOrderMilestone(vendorOrderId: string): void {
    const orderData = this.selectedOrder();
    if (!orderData) return;

    this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: true }));
    this.paymentService.initiateVendorOrderPayment({ vendorOrderId: Number(vendorOrderId) }).subscribe({
      next: (res) => {
        if (res && res.paymentUrl) {
          this.paymentService.startPaymentFlow(res.paymentUrl, Number(orderData.id)).subscribe({
            next: (paymentRes) => {
              this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: false }));
              if (paymentRes.success) {
                this.uiState.showAlert('success', this.translationService.translate('ORDER_DETAILS_PAYMENT_SUCCESS') || 'Payment completed successfully');
                this.loadOrderDetails(orderData.id);
              } else {
                this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_PAYMENT_FAILED') || 'Payment was unsuccessful or cancelled');
              }
            },
            error: () => {
              this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: false }));
            }
          });
        } else {
          this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: false }));
          this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR') || 'Failed to initiate payment');
        }
      },
      error: (err) => {
        this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: false }));
        console.error('Failed to initiate vendor order payment:', err);
        this.uiState.showAlert('danger', err.error?.message || this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR') || 'Failed to initiate payment');
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
        this.loadRemainingBalance(id);
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
        this.loadRemainingBalance(id);
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

  normalizeStatus(val: string | undefined | null): OrderStatus {
    if (!val) return 'pending';
    const lower = val.toLowerCase();
    if (lower === 'awaitingcustomerapproval' || lower === 'awaiting_customer_approval') return 'awaiting_customer_approval';
    if (lower === 'pendingpayment' || lower === 'pending_payment') return 'pending_payment';
    if (lower === 'confirmed') return 'confirmed';
    if (lower === 'inprogress' || lower === 'in progress' || lower === 'in_progress' || lower === 'processing') return 'in_progress';
    if (lower === 'shipped' || lower === 'ready') return 'shipped';
    if (lower === 'delivered' || lower === 'completed') return 'delivered';
    if (lower === 'cancelled') return 'cancelled';
    if (lower === 'refunded') return 'refunded';
    if (lower === 'returned') return 'returned';
    return 'pending';
  }

  displayStatusFor(order: IOrder): OrderStatus {
    const status = order.status;
    const history = order.statusHistory;
    const isTerminalNegative = status === 'cancelled' || status === 'refunded' || status === 'returned';

    if (isTerminalNegative) {
      if (history?.oldStatus) {
        return this.normalizeStatus(history.oldStatus);
      }
      return 'pending';
    } else if (history?.newStatus) {
      return this.normalizeStatus(history.newStatus);
    }
    return this.normalizeStatus(status);
  }

  /**
   * Generates step view models for the status timeline component.
   */
  timelineFor(order: IOrder): TimelineStepVm[] {
    const status = order.status;
    const history = order.statusHistory;
    const isTerminalNegative = status === 'cancelled' || status === 'refunded' || status === 'returned';

    // Sequence of steps shown in the timeline
    const coreSequence: OrderStatus[] = [
      'pending',
      'confirmed',
      'in_progress',
      'shipped',
      'delivered'
    ];

    const sequence: OrderStatus[] = [...coreSequence];
    if (isTerminalNegative) {
      sequence.push(status);
    }

    // Determine the base status for normal steps completion mapping
    let baseStatusKey = this.displayStatusFor(order);



    // Map the removed intermediate statuses to 'pending' for the visual timeline
    if (baseStatusKey === 'awaiting_customer_approval' || baseStatusKey === 'pending_payment') {
      baseStatusKey = 'pending';
    }

    const baseActiveIndex = coreSequence.indexOf(baseStatusKey);

    return sequence.map((key) => {
      if (key === 'cancelled' || key === 'refunded' || key === 'returned') {
        return {
          key,
          isComplete: false,
          isActive: true, // The terminal status itself is current/active
        };
      }

      const idx = coreSequence.indexOf(key);
      const isComplete = idx < baseActiveIndex || (idx === baseActiveIndex && (status === 'delivered' || status === 'completed'));
      const isActive = idx === baseActiveIndex && !isTerminalNegative && status !== 'delivered' && status !== 'completed';

      return {
        key,
        isComplete,
        isActive,
      };
    });
  }

  /**
   * Centralized Business Logic: Order status badge tone mapping.
   * Pending -> warning
   * Awaiting Customer Approval -> warning
   * Pending Payment -> warning
   * Confirmed -> info
   * In Progress -> info
   * Shipped -> primary (brand)
   * Delivered -> success
   * Cancelled -> danger
   */
  orderStatusTone(status: OrderStatus): StatusBadgeTone {
    switch (status) {
      case 'pending':
      case 'awaiting_customer_approval':
      case 'pending_payment':
        return 'warning';
      case 'confirmed':
      case 'in_progress':
      case 'processing':
        return 'info';
      case 'ready':
      case 'shipped':
        return 'brand'; // primary brand color
      case 'delivered':
      case 'completed':
        return 'success';
      case 'cancelled':
      case 'refunded':
      case 'returned':
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
      case 'Paid':
      case 'paid':
        return 'success';
      case 'PartialPaid':
      case 'Partial_Paid':
        return 'info';
      case 'pending':
      case 'unpaid':
      case 'Unpaid':
        return 'warning';
      case 'failed':
      case 'Failed':
        return 'danger';
      case 'Cancelled':
      case 'cancelled':
        return 'neutral';
      case 'refunded':
      case 'Refunded':
        return 'info';
      default:
        return 'neutral';
    }
  }
}
