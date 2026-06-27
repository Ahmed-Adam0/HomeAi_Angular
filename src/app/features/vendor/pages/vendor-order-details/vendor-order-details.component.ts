import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { DialogService } from '../../../../shared/services/dialog.service';
import { OrderStatusBadge } from '../../components';
import { IVendorOrder } from '../../interfaces';
import { VendorOrderStatus, ALLOWED_TRANSITIONS, isValidTransition, OrderStatus, mapToOrderStatusPayload } from '../../models/vendor-order-status.enum';
import { VendorService } from '../../services/vendor.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { Button } from '../../../../shared/components/button/button.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-vendor-order-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    OrderStatusBadge,
    TranslatePipe,
    CurrencyFormatPipe,
    Button,
    AlertComponent,
    EmptyStateComponent,
    SkeletonLoader,
    LoadingSpinner,
    DatePicker,
    FormsModule,
  ],
  templateUrl: './vendor-order-details.component.html',
  styleUrls: ['./vendor-order-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorOrderDetails implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uiState = inject(UiState);
  private readonly translationService = inject(TranslationService);
  private readonly dialogService = inject(DialogService);

  protected readonly VendorOrderStatus = VendorOrderStatus;

  readonly order = signal<IVendorOrder | null>(null);
  readonly remainingBalanceDetails = signal<any | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedStatus = signal<VendorOrderStatus | null>(null);
  readonly isUpdatingStatus = signal<boolean>(false);
  readonly statusUpdateError = signal<string | null>(null);
  readonly isProposingDate = signal<boolean>(false);
  readonly proposedDate = signal<Date | null>(null);

  readonly minDate = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  readonly isDateInvalid = computed(() => {
    const date = this.proposedDate();
    if (!date) return false;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return date.getTime() < todayStart.getTime();
  });

  protected readonly skeletonItems = Array(3);

  readonly collapsedVendors = signal<Record<string, boolean>>({});

  readonly activeTab = signal<'overview' | 'products' | 'timeline' | 'customer' | 'payment'>('overview');

  selectTab(tab: 'overview' | 'products' | 'timeline' | 'customer' | 'payment'): void {
    this.activeTab.set(tab);
  }

  readonly itemsByVendor = computed(() => {
    const orderData = this.order();
    if (!orderData || !orderData.items) return [];

    const groups: Record<string, typeof orderData.items> = {};
    
    orderData.items.forEach(item => {
      const vendor = (item as any).vendorName || 'FurniMind Seller';
      if (!groups[vendor]) {
        groups[vendor] = [];
      }
      groups[vendor].push(item);
    });

    return Object.keys(groups).map(vendorName => ({
      vendorName,
      items: groups[vendorName]
    }));
  });

  readonly totalQuantity = computed(() => {
    const orderData = this.order();
    if (!orderData || !orderData.items) return 0;
    return orderData.items.reduce((sum, item) => sum + item.quantity, 0);
  });

  toggleVendorCollapse(vendorName: string): void {
    this.collapsedVendors.update(prev => ({
      ...prev,
      [vendorName]: !prev[vendorName]
    }));
  }

  isVendorCollapsed(vendorName: string): boolean {
    return !!this.collapsedVendors()[vendorName];
  }

  readonly breadcrumbs = computed(() => {
    const orderNumber = this.order()?.orderNumber || '';
    return [
      { label: this.translationService.translate('VENDOR.COMMON.PORTAL'), url: '/vendor' },
      { label: this.translationService.translate('VENDOR.ORDERS.TITLE'), url: '/vendor/orders' },
      { label: orderNumber ? `#${orderNumber}` : '...' },
    ];
  });

  readonly timelineSteps = computed(() => {
    const currentStatus = this.order()?.status;

    const steps = [
      { status: VendorOrderStatus.Pending, labelKey: 'VENDOR.STATUS.PENDING', icon: 'clock' },
      { status: VendorOrderStatus.AwaitingCustomerApproval, labelKey: 'VENDOR.STATUS.AWAITING_CUSTOMER_APPROVAL', icon: 'clock' },
      { status: VendorOrderStatus.PendingPayment, labelKey: 'VENDOR.STATUS.PENDING_PAYMENT', icon: 'clock' },
      { status: VendorOrderStatus.Confirmed, labelKey: 'VENDOR.STATUS.CONFIRMED', icon: 'check-circle' },
      { status: VendorOrderStatus.InProgress, labelKey: 'VENDOR.STATUS.IN_PROGRESS', icon: 'play-circle' },
      { status: VendorOrderStatus.Shipped, labelKey: 'VENDOR.STATUS.SHIPPED', icon: 'package' },
      { status: VendorOrderStatus.Delivered, labelKey: 'VENDOR.STATUS.DELIVERED', icon: 'truck' },
    ];

    if (!currentStatus) {
      return steps.map((s) => ({ ...s, active: false, completed: false, isCancelled: false }));
    }

    if (currentStatus === VendorOrderStatus.Cancelled) {
      return steps.map((s) => ({ ...s, active: false, completed: false, isCancelled: true }));
    }

    const statusOrder = [
      VendorOrderStatus.Pending,
      VendorOrderStatus.AwaitingCustomerApproval,
      VendorOrderStatus.PendingPayment,
      VendorOrderStatus.Confirmed,
      VendorOrderStatus.InProgress,
      VendorOrderStatus.Shipped,
      VendorOrderStatus.Delivered,
    ];

    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((s) => {
      const stepIndex = statusOrder.indexOf(s.status);
      return {
        ...s,
        active: s.status === currentStatus,
        completed: stepIndex < currentIndex,
        isCancelled: false,
      };
    });
  });

  readonly stepperProgressPercent = computed(() => {
    const steps = this.timelineSteps();
    const completedCount = steps.filter(s => s.completed).length;
    const activeCount = steps.filter(s => s.active).length;
    if (completedCount === steps.length) return 100;
    
    const totalIntervals = steps.length - 1;
    let index = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].active) {
        index = i;
        break;
      }
    }
    if (completedCount > 0 && activeCount === 0) {
      for (let i = steps.length - 1; i >= 0; i--) {
        if (steps[i].completed) {
          index = i;
          break;
        }
      }
    }
    return (index / totalIntervals) * 100;
  });

  printInvoice(): void {
    window.print();
  }

  setQuickStatus(status: VendorOrderStatus): void {
    if (this.isUpdatingStatus() || !this.canModifyStatus()) {
      return;
    }
    this.selectedStatus.set(status);
    this.statusUpdateError.set(null);
    this.openStatusUpdateConfirmation();
  }

  private readonly statusOptionList: readonly { value: VendorOrderStatus; labelKey: string }[] = [
    { value: VendorOrderStatus.Pending, labelKey: 'VENDOR.STATUS.PENDING' },
    { value: VendorOrderStatus.AwaitingCustomerApproval, labelKey: 'VENDOR.STATUS.AWAITING_CUSTOMER_APPROVAL' },
    { value: VendorOrderStatus.PendingPayment, labelKey: 'VENDOR.STATUS.PENDING_PAYMENT' },
    { value: VendorOrderStatus.Confirmed, labelKey: 'VENDOR.STATUS.CONFIRMED' },
    { value: VendorOrderStatus.InProgress, labelKey: 'VENDOR.STATUS.IN_PROGRESS' },
    { value: VendorOrderStatus.Shipped, labelKey: 'VENDOR.STATUS.SHIPPED' },
    { value: VendorOrderStatus.Delivered, labelKey: 'VENDOR.STATUS.DELIVERED' },
    { value: VendorOrderStatus.Cancelled, labelKey: 'VENDOR.STATUS.CANCELLED' },
  ];

  readonly statusOptions = this.statusOptionList;

  readonly availableStatusOptions = computed<readonly { value: VendorOrderStatus; labelKey: string }[]>(() => {
    const currentStatus = this.order()?.status;
    if (!currentStatus) {
      return [] as readonly { value: VendorOrderStatus; labelKey: string }[];
    }

    const allowedNextStatuses = this.getAllowedNextStatuses(currentStatus);
    return this.statusOptions.filter((option) => allowedNextStatuses.includes(option.value));
  });

  readonly canModifyStatus = computed(() => {
    const currentStatus = this.order()?.status;
    return currentStatus !== undefined &&
      currentStatus !== null &&
      currentStatus !== VendorOrderStatus.Pending &&
      currentStatus !== VendorOrderStatus.AwaitingCustomerApproval &&
      currentStatus !== VendorOrderStatus.PendingPayment &&
      !this.isTerminalStatus(currentStatus);
  });

  readonly isUpdateButtonDisabled = computed(() => {
    const currentStatus = this.order()?.status;
    return (
      this.isUpdatingStatus() ||
      !this.order() ||
      !this.selectedStatus() ||
      this.selectedStatus() === currentStatus ||
      !this.canModifyStatus()
    );
  });

  readonly confirmDialogMessage = computed(() => {
    const status = this.selectedStatus();
    const labelKey = this.statusOptions.find((option) => option.value === status)?.labelKey;

    if (!status || !labelKey) {
      return '';
    }

    return this.translationService
      .translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_CONFIRM_MESSAGE')
      .replace('{{status}}', this.translationService.translate(labelKey));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.error.set('Order ID is missing in the route parameters.');
      return;
    }

    this.loadOrderDetails(id);
  }

  private loadOrderDetails(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.statusUpdateError.set(null);

    this.vendorService
      .getOrderById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orderData) => {
          this.order.set(orderData);
          this.selectedStatus.set(orderData.status);
          this.loading.set(false);
          this.loadRemainingBalance(id);
        },
        error: (err) => {
          console.error('Failed to load vendor order details:', err);
          this.error.set(err.message || 'An error occurred while loading order details.');
          this.loading.set(false);
        },
      });
  }

  private loadRemainingBalance(id: string): void {
    this.vendorService.getVendorOrderRemainingBalance(id).subscribe({
      next: (breakdown) => {
        this.remainingBalanceDetails.set(breakdown);
      },
      error: (err) => {
        console.error('Failed to load vendor order remaining balance:', err);
      }
    });
  }

  onStatusSelection(event: Event): void {
    const value = (event.target as HTMLSelectElement)?.value as VendorOrderStatus | undefined;
    if (!value || !Object.values(VendorOrderStatus).includes(value)) {
      return;
    }
    this.selectedStatus.set(value);
    this.statusUpdateError.set(null);
  }

  async openStatusUpdateConfirmation(): Promise<void> {
    if (this.isUpdateButtonDisabled()) {
      return;
    }

    const confirmed = await this.dialogService.openConfirm({
      title: this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_CONFIRM_TITLE'),
      message: this.confirmDialogMessage(),
      confirmText: this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS'),
      cancelText: this.translationService.translate('COMMON.CANCEL'),
      variant: 'warning',
    });

    if (confirmed) {
      this.confirmStatusUpdate();
    }
  }

  confirmStatusUpdate(): void {
    const order = this.order();
    const orderId = Number(order?.id);
    const selectedStatus = this.selectedStatus();

    if (!orderId || !selectedStatus || !order) {
      return;
    }

    // Apply strict transition guard check in UI layer before hitting the API
    if (!isValidTransition(order.status, selectedStatus)) {
      this.statusUpdateError.set(
        this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_ERROR')
      );
      return;
    }

    this.statusUpdateError.set(null);
    this.isUpdatingStatus.set(true);

    const statusPayload = mapToOrderStatusPayload(selectedStatus);

    this.vendorService
      .updateOrderStatus(orderId, statusPayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUpdatingStatus.set(false);
          this.uiState.showAlert('success', this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_SUCCESS'));
          this.loadOrderDetails(orderId.toString());
        },
        error: (err: unknown) => {
          console.error('Failed to update vendor order status:', err);
          if (err instanceof HttpErrorResponse && err.status === 400) {
            console.error('[VendorOrderDetails] 400 Bad Request error. Sent payload:', { newStatus: statusPayload });
          }
          let errorMsg = '';
          if (err instanceof HttpErrorResponse) {
            switch (err.status) {
              case 400:
                errorMsg = this.translationService.translate('VENDOR.ORDER_DETAILS.ERROR_400');
                break;
              case 401:
                errorMsg = this.translationService.translate('VENDOR.ORDER_DETAILS.ERROR_401');
                break;
              case 404:
                errorMsg = this.translationService.translate('VENDOR.ORDER_DETAILS.ERROR_404');
                break;
              case 500:
                errorMsg = this.translationService.translate('VENDOR.ORDER_DETAILS.ERROR_500');
                break;
              default:
                errorMsg = err.error?.message || err.message || this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_ERROR');
                break;
            }
          } else {
            errorMsg = this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_ERROR');
          }
          this.statusUpdateError.set(errorMsg);
          this.isUpdatingStatus.set(false);
        },
      });
  }

  submitProposedDate(): void {
    const order = this.order();
    const date = this.proposedDate();
    if (!order || !date || this.isDateInvalid()) return;

    this.isProposingDate.set(true);
    // Convert to ISO String for backend API
    const isoDate = date.toISOString();

    this.vendorService.proposeDeliveryDate(order.id, isoDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isProposingDate.set(false);
          this.uiState.showAlert('success', this.translationService.translate('VENDOR.ORDER_DETAILS.PROPOSE_DATE_SUCCESS'));
          this.loadOrderDetails(order.id);
        },
        error: (err) => {
          console.error('Failed to propose delivery date:', err);
          let errorMsg = '';
          if (err && err.error) {
            if (typeof err.error === 'string') {
              errorMsg = err.error;
            } else if (err.error.message) {
              errorMsg = err.error.message;
            } else if (err.error.errors) {
              const messages: string[] = [];
              for (const key in err.error.errors) {
                if (Array.isArray(err.error.errors[key])) {
                  messages.push(...err.error.errors[key]);
                } else {
                  messages.push(err.error.errors[key]);
                }
              }
              if (messages.length > 0) {
                errorMsg = messages.join(' ');
              }
            }
          }
          if (!errorMsg) {
            errorMsg = err.message || this.translationService.translate('VENDOR.ORDER_DETAILS.PROPOSE_DATE_ERROR');
          }
          this.uiState.showAlert('danger', errorMsg);
          this.isProposingDate.set(false);
        }
      });
  }

  private isTerminalStatus(status: VendorOrderStatus): boolean {
    return status === VendorOrderStatus.Delivered || status === VendorOrderStatus.Cancelled;
  }

  private getAllowedNextStatuses(status: VendorOrderStatus): readonly VendorOrderStatus[] {
    return ALLOWED_TRANSITIONS[status] || [];
  }
}
