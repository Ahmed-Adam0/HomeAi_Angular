import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrderStatusBadge } from '../../components';
import { IVendorOrder } from '../../interfaces';
import { VendorOrderStatus, ALLOWED_TRANSITIONS, isValidTransition } from '../../models/vendor-order-status.enum';
import { VendorService } from '../../services/vendor.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { Button } from '../../../../shared/components/button/button.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-vendor-order-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    OrderStatusBadge,
    TranslatePipe,
    ConfirmDialog,
    PageHeaderComponent,
    Button,
    AlertComponent,
    EmptyStateComponent,
    SkeletonLoader,
    LoadingSpinner,
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

  protected readonly VendorOrderStatus = VendorOrderStatus;

  readonly order = signal<IVendorOrder | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly selectedStatus = signal<VendorOrderStatus | null>(null);
  readonly isUpdatingStatus = signal<boolean>(false);
  readonly statusUpdateError = signal<string | null>(null);
  readonly isConfirmDialogVisible = signal(false);

  protected readonly skeletonItems = Array(3);

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
      { status: VendorOrderStatus.Accepted, labelKey: 'VENDOR.STATUS.CONFIRMED', icon: 'check-circle' },
      { status: VendorOrderStatus.InProgress, labelKey: 'VENDOR.STATUS.PROCESSING', icon: 'play-circle' },
      { status: VendorOrderStatus.ReadyForPickup, labelKey: 'VENDOR.STATUS.SHIPPED', icon: 'truck' },
      { status: VendorOrderStatus.Delivered, labelKey: 'VENDOR.STATUS.DELIVERED', icon: 'package' },
    ];

    if (!currentStatus) {
      return steps.map((s) => ({ ...s, active: false, completed: false, isCancelled: false }));
    }

    if (currentStatus === VendorOrderStatus.Cancelled) {
      return steps.map((s) => ({ ...s, active: false, completed: false, isCancelled: true }));
    }

    const statusOrder = [
      VendorOrderStatus.Accepted,
      VendorOrderStatus.InProgress,
      VendorOrderStatus.ReadyForPickup,
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
    { value: VendorOrderStatus.Accepted, labelKey: 'VENDOR.STATUS.CONFIRMED' },
    { value: VendorOrderStatus.InProgress, labelKey: 'VENDOR.STATUS.PROCESSING' },
    { value: VendorOrderStatus.ReadyForPickup, labelKey: 'VENDOR.STATUS.SHIPPED' },
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
    return currentStatus !== undefined && currentStatus !== null && !this.isTerminalStatus(currentStatus);
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
        },
        error: (err) => {
          console.error('Failed to load vendor order details:', err);
          this.error.set(err.message || 'An error occurred while loading order details.');
          this.loading.set(false);
        },
      });
  }

  onStatusSelection(event: Event): void {
    const value = (event.target as HTMLSelectElement)?.value;
    console.log('onStatusSelection called with:', { value });
    this.selectedStatus.set(value as VendorOrderStatus);
    this.statusUpdateError.set(null);
  }

  openStatusUpdateConfirmation(): void {
    if (this.isUpdateButtonDisabled()) {
      return;
    }

    this.isConfirmDialogVisible.set(true);
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

    this.isConfirmDialogVisible.set(false);
    this.statusUpdateError.set(null);
    this.isUpdatingStatus.set(true);

    this.vendorService
      .updateOrderStatus(orderId, selectedStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isUpdatingStatus.set(false);
          this.uiState.showAlert('success', this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_SUCCESS'));
          this.loadOrderDetails(orderId.toString());
        },
        error: (err) => {
          console.error('Failed to update vendor order status:', err);
          this.statusUpdateError.set(err.message || this.translationService.translate('VENDOR.ORDER_DETAILS.UPDATE_STATUS_ERROR'));
          this.isUpdatingStatus.set(false);
        },
      });
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogVisible.set(false);
  }

  private isTerminalStatus(status: VendorOrderStatus): boolean {
    return status === VendorOrderStatus.Delivered || status === VendorOrderStatus.Cancelled;
  }

  private getAllowedNextStatuses(status: VendorOrderStatus): readonly VendorOrderStatus[] {
    return ALLOWED_TRANSITIONS[status] || [];
  }
}
