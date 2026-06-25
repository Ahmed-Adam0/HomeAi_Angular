import { Component, computed, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdersFacade, PaymentStatus } from '../../data-access/orders.facade';
import { OrderStatus } from '../../interfaces';
import { NotificationService as InternalNotificationService } from '../../../notifications/services/notification.service';
import { Button } from '../../../../shared/components/button/button.component';
import { StatusBadgeComponent, StatusBadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { StatusTranslationPipe } from '../../../../shared/pipes/status-translation.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { OrderTimelineComponent } from '../../components/order-timeline/order-timeline.component';
import { ShippingInfoComponent } from '../../components/shipping-info/shipping-info.component';
import { InvoiceSummaryComponent } from '../../components/invoice-summary/invoice-summary.component';
import { OrderedItemsComponent } from '../../components/ordered-items/ordered-items.component';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';
import { AuthService } from '../../../auth/services/auth.service';
import { PaymentService } from '../../../payment/services/payment.service';


export interface EditItemForm {
  productId: FormControl<number>;
  quantity: FormControl<number>;
  productName: FormControl<string>;
  productNameEn: FormControl<string>;
  productNameAr: FormControl<string>;
  price: FormControl<number>;
  productImage: FormControl<string>;
}

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    ReactiveFormsModule,
    Button,
    StatusBadgeComponent,
    TranslatePipe,
    StatusTranslationPipe,
    CurrencyFormatPipe,
    LocalizedPipe,
    RtlDirective,
    OrderTimelineComponent,
    ShippingInfoComponent,
    InvoiceSummaryComponent,
    OrderedItemsComponent,
    ConfirmDialog,
    ModalComponent,
    SkeletonLoader,
    LazyImageDirective,
    AutoDirectionDirective,
  ],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
  providers: [OrdersFacade],
})
export class OrderDetails {
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  readonly facade = inject(OrdersFacade);
  private uiState = inject(UiState);
  readonly translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly internalNotificationService = inject(InternalNotificationService);

  readonly order = computed(() => this.facade.selectedOrder());

  readonly isConfirmDialogVisible = signal(false);
  readonly isEditModalVisible = signal(false);
  readonly isApproveDialogVisible = signal(false);
  readonly isRejectDialogVisible = signal(false);
  readonly selectedVendorOrderId = signal<string | null>(null);
  readonly isInitiatingPayment = signal(false);
  readonly isDeliveryModalVisible = signal(false);

  readonly hasPendingPaymentOrders = computed(() => {
    const vOrders = this.order()?.vendorOrders ?? [];
    return vOrders.some(vo => vo.status === 'pending_payment');
  });

  readonly pendingPaymentTotal = computed(() => {
    const vOrders = this.order()?.vendorOrders ?? [];
    return vOrders
      .filter(vo => vo.status === 'pending_payment')
      .reduce((sum, vo) => sum + vo.totalPrice, 0);
  });

  readonly amountPaid = computed(() => {
    const data = this.order();
    if (!data) return 0;
    if (this.hasPendingPaymentOrders()) {
      return Math.max(0, data.totalAmount - this.pendingPaymentTotal());
    }
    return data.paymentStatus === 'paid' ? data.totalAmount : 0;
  });

  editForm: FormGroup | null = null;

  constructor() {
    this.facade.connectDetailsRoute(this.route);

    // Delivery success triggers (Modal & Notification Center)
    effect(() => {
      const currentOrder = this.order();
      if (currentOrder && currentOrder.status === 'delivered') {
        const orderId = currentOrder.id;

        // 1. Show delivery success modal once per order
        const modalStorageKey = `delivery_modal_shown_${orderId}`;
        const hasShownModal = localStorage.getItem(modalStorageKey);
        if (!hasShownModal) {
          this.isDeliveryModalVisible.set(true);
          localStorage.setItem(modalStorageKey, 'true');
        }

        // 2. Add local notification for delivered order once
        const notificationStorageKey = `delivered_notification_added_${orderId}`;
        const hasNotificationAdded = localStorage.getItem(notificationStorageKey);
        if (!hasNotificationAdded) {
          const orderNum = currentOrder.orderNumber || '';
          this.internalNotificationService.addNotification({
            id: Math.floor(Math.random() * 1000000) + 9000000,
            title: this.translationService.translate('NOTIFICATION_ORDER_DELIVERED_TITLE').replace('{{orderNumber}}', orderNum),
            message: this.translationService.translate('NOTIFICATION_ORDER_DELIVERED_DESC'),
            isRead: false,
            createdAt: new Date(),
            actionUrl: `/share-transformation?orderId=${orderId}`
          });
          localStorage.setItem(notificationStorageKey, 'true');
        }
      }
    });
  }

  onShareTransformation(): void {
    const orderId = this.order()?.id;
    if (orderId) {
      this.router.navigate(['/share-transformation'], { queryParams: { orderId } });
    }
  }

  onShareFromModal(): void {
    this.isDeliveryModalVisible.set(false);
    this.onShareTransformation();
  }

  onPayApprovedOrders(): void {
    const orderData = this.order();
    if (!orderData) return;

    const hasPendingPaymentOrders = this.hasPendingPaymentOrders();
    if (!hasPendingPaymentOrders) {
      this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_NO_APPROVED_ORDERS_ERROR'));
      return;
    }

    if (!orderData.id) {
      return;
    }

    const payload = {
      masterOrderId: Number(orderData.id)
    };

    this.isInitiatingPayment.set(true);
    this.paymentService.initiateMasterOrderPayment(payload).subscribe({
      next: (res) => {
        this.isInitiatingPayment.set(false);
        if (res && res.paymentUrl) {
          window.location.href = res.paymentUrl;
        } else {
          this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR'));
        }
      },
      error: (err) => {
        this.isInitiatingPayment.set(false);
        console.error('Failed to initiate master order payment:', err);
        this.uiState.showAlert('danger', err.error?.message || this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR'));
      }
    });
  }

  get editItemsArray(): FormArray<FormGroup<EditItemForm>> | null {
    return this.editForm?.get('items') as FormArray<FormGroup<EditItemForm>> | null;
  }

  onEdit(): void {
    if (!this.facade.canModifyOrder()) return;
    this.buildEditForm();
    this.isEditModalVisible.set(true);
  }

  private buildEditForm(): void {
    const items = this.order()?.items ?? [];
    if (items.length === 0) return;

    this.editForm = this.fb.group({
      items: this.fb.array(
        items.map((item) =>
          this.fb.nonNullable.group({
            productId: [item.productId, Validators.required],

            quantity: [item.quantity, [Validators.required, Validators.min(1), Validators.max(99)]],
            productName: [item.productName, Validators.required],
            productNameEn: [item.productNameEn ?? item.productName],
            productNameAr: [item.productNameAr ?? item.productName],
            price: [item.unitPrice, Validators.required],
            productImage: [item.productImage ?? ''],
          })
        )
      ),
    });
  }


  onSaveEdit(): void {
    if (!this.editForm?.valid || !this.order()) return;

    const orderId = this.order()!.id;
    const raw = this.editForm.getRawValue() as { items: { productId: number; quantity: number; productName: string; productNameEn: string; productNameAr: string; price: number; productImage: string }[] };
    const items = raw.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    if (!items || items.length === 0) return;

    this.facade.updateOrderItems(orderId, items).subscribe({
      next: (updatedOrder) => {
        if (updatedOrder) {
          this.isEditModalVisible.set(false);
          this.editForm = null;
          this.uiState.showAlert('success', this.translationService.translate('ORDER_DETAILS_EDIT_SUCCESS'));
        }
      },
      error: () => {
        this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_EDIT_ERROR'));
      },
    });
  }

  onCancelEdit(): void {
    this.isEditModalVisible.set(false);
    this.editForm = null;
  }

  adjustQuantity(index: number, delta: number): void {
    const control = this.editItemsArray?.at(index)?.get('quantity');
    if (!control) return;
    const current = control.value;
    const next = current + delta;
    if (next >= 1 && next <= 99) {
      control.setValue(next);
      control.markAsDirty();
    }
  }

  onCancel(): void {
    if (this.facade.canModifyOrder()) {
      this.isConfirmDialogVisible.set(true);
    }
  }

  confirmCancellation(): void {
    const orderId = this.order()?.id;
    if (!orderId) return;

    this.isConfirmDialogVisible.set(false);

    this.facade.cancelOrder(orderId).subscribe({
      next: (updatedOrder) => {
        if (updatedOrder) {
          const msg = this.translationService.translate('ORDER_DETAILS_CANCEL_SUCCESS');
          this.uiState.showAlert('success', msg);
        } else {
          const errorMsg = this.translationService.translate('ORDER_DETAILS_CANCEL_ERROR');
          this.uiState.showAlert('danger', errorMsg);
        }
      },
      error: () => {
        const errorMsg = this.translationService.translate('ORDER_DETAILS_CANCEL_ERROR');
        this.uiState.showAlert('danger', errorMsg);
      }
    });
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogVisible.set(false);
  }

  onApproveDate(vendorOrderId: string): void {
    this.selectedVendorOrderId.set(vendorOrderId);
    this.isApproveDialogVisible.set(true);
  }

  confirmApproveDate(): void {
    const vendorOrderId = this.selectedVendorOrderId();
    if (!vendorOrderId) return;
    this.isApproveDialogVisible.set(false);
    this.facade.approveDeliveryDate(vendorOrderId).subscribe({
      next: () => {
        this.uiState.showAlert('success', this.translationService.translate('CUSTOMER_ORDER_APPROVE_SUCCESS'));
        this.selectedVendorOrderId.set(null);
      },
      error: (err) => {
        console.error('Failed to approve delivery date:', err);
        this.uiState.showAlert('danger', err.message || 'An error occurred while approving delivery date.');
        this.selectedVendorOrderId.set(null);
      }
    });
  }

  closeApproveDialog(): void {
    this.isApproveDialogVisible.set(false);
    this.selectedVendorOrderId.set(null);
  }

  onRejectDate(vendorOrderId: string): void {
    this.selectedVendorOrderId.set(vendorOrderId);
    this.isRejectDialogVisible.set(true);
  }

  confirmRejectDate(): void {
    const vendorOrderId = this.selectedVendorOrderId();
    if (!vendorOrderId) return;
    this.isRejectDialogVisible.set(false);
    this.facade.rejectDeliveryDate(vendorOrderId).subscribe({
      next: () => {
        this.uiState.showAlert('success', this.translationService.translate('CUSTOMER_ORDER_REJECT_SUCCESS'));
        this.selectedVendorOrderId.set(null);
      },
      error: (err) => {
        console.error('Failed to reject delivery date:', err);
        this.uiState.showAlert('danger', err.message || 'An error occurred while rejecting delivery date.');
        this.selectedVendorOrderId.set(null);
      }
    });
  }

  closeRejectDialog(): void {
    this.isRejectDialogVisible.set(false);
    this.selectedVendorOrderId.set(null);
  }

  orderStatusTone(status: OrderStatus): StatusBadgeTone {
    return this.facade.orderStatusTone(status);
  }

  paymentStatusTone(status: PaymentStatus): StatusBadgeTone {
    return this.facade.paymentStatusTone(status);
  }

  historyStatusTone(statusStr: string): StatusBadgeTone {
    const raw = (statusStr ?? '').toLowerCase();
    const status: OrderStatus = 
      raw === 'inprogress' || raw === 'in progress' || raw === 'in_progress'
        ? 'in_progress'
        : raw === 'awaitingcustomerapproval' || raw === 'awaiting_customer_approval'
        ? 'awaiting_customer_approval'
        : raw === 'pendingpayment' || raw === 'pending_payment'
        ? 'pending_payment'
        : raw as OrderStatus;
    return this.facade.orderStatusTone(status);
  }
}
