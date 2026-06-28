import { Component, computed, inject, signal, effect } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdersFacade, PaymentStatus } from '../../data-access/orders.facade';
import { OrderStatus } from '../../interfaces';

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


  readonly order = computed(() => this.facade.selectedOrder());

  readonly isConfirmDialogVisible = signal(false);
  readonly isEditModalVisible = signal(false);
  readonly isApproveDialogVisible = signal(false);
  readonly isRejectDialogVisible = signal(false);
  readonly selectedVendorOrderId = signal<string | null>(null);
  readonly isInitiatingPayment = signal(false);
  readonly isInitiatingVendorPayment = signal<Record<string, boolean>>({});

  readonly remainingBalanceDetails = signal<any | null>(null);
  readonly isLoadingBreakdown = signal<boolean>(false);

  readonly hasPendingPaymentOrders = computed(() => {
    return this.pendingPaymentTotal() > 0 || this.activeVendorOrdersTotal() > 0;
  });

  private normalizeStatus(value: string | undefined | null): string {
    if (!value) return '';
    return value
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s_-]+/g, '_')
      .toLowerCase();
  }

  readonly pendingPaymentTotal = computed(() => {
    const breakdown = this.remainingBalanceDetails();
    if (!breakdown || !breakdown.milestones) return 0;

    const vOrders = this.order()?.vendorOrders ?? [];
    return breakdown.milestones
      .filter((m: any) => {
        if (m.isPaid) return false;
        const vo = vOrders.find(o => o.id === m.vendorOrderId.toString());
        if (!vo) return false;
        return this.normalizeStatus(m.milestoneStatus) === vo.status &&
          (vo.status === 'pending_payment' || vo.status === 'shipped' || vo.status === 'delivered');
      })
      .reduce((sum: number, m: any) => sum + m.amount, 0);
  });

  /** Active vendor-order statuses — normalized snake_case versions of the
   *  backend enum, covering Confirmed → Delivered.
   *  normalizeStatus() converts e.g. "Confirmed" → "confirmed" */
  private readonly ACTIVE_VO_STATUSES = new Set([
    'confirmed',                  // Confirmed
    'in_progress',                // InProgress
    'pending_payment',            // PendingPayment
    'shipped',                    // Shipped
    'delivered',                  // Delivered
  ]);

  readonly activeVendorOrdersTotal = computed(() => {
    const vOrders = this.order()?.vendorOrders ?? [];
    return vOrders
      .filter(vo => this.ACTIVE_VO_STATUSES.has(this.normalizeStatus(vo.status)))
      .reduce((sum, vo) => sum + (vo.totalPrice ?? 0), 0);
  });

  readonly amountPaid = computed(() => {
    const breakdown = this.remainingBalanceDetails();
    if (breakdown) {
      return breakdown.totalPrice - breakdown.remainingBalance;
    }
    const data = this.order();
    if (!data) return 0;
    return (data.paymentStatus === 'Paid' || data.paymentStatus === 'paid') ? data.totalAmount : 0;
  });

  /** Amount to Pay is the difference between active orders total and amount paid. */
  readonly amountToPay = computed(() => {
    return Math.max(0, this.activeVendorOrdersTotal() - this.amountPaid());
  });

  readonly calculatedPaymentStatus = computed(() => {
    const total = this.activeVendorOrdersTotal();
    const paid = this.amountPaid();
    
    // Fall back to backend status if no active totals to compare against
    if (total === 0) {
      return this.order()?.paymentStatus || 'Unpaid';
    }
    
    if (paid >= total) {
      return 'Paid';
    }
    if (paid === 0) {
      return 'Unpaid';
    }
    return 'PartialPaid'; // Partial payment
  });

  editForm: FormGroup | null = null;

  constructor() {
    this.facade.connectDetailsRoute(this.route);

    effect(() => {
      const orderData = this.order();
      if (orderData && orderData.id) {
        this.loadRemainingBalance(orderData.id);
      }
    });
  }

  loadRemainingBalance(orderId: string | number): void {
    this.paymentService.getMasterOrderRemainingBalance(orderId).subscribe({
      next: (breakdown) => {
        this.remainingBalanceDetails.set(breakdown);
      },
      error: (err) => {
        console.error('Failed to load payment breakdown:', err);
      }
    });
  }

  onPayVendorOrderMilestone(vendorOrderId: string): void {
    this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: true }));
    this.paymentService.initiateVendorOrderPayment({ vendorOrderId: Number(vendorOrderId) }).subscribe({
      next: (res) => {
        if (res && res.paymentUrl) {
          this.paymentService.startPaymentFlow(res.paymentUrl, Number(this.order()?.id || 0)).subscribe({
            next: (paymentRes) => {
              this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: false }));
              if (paymentRes.success) {
                this.uiState.showAlert('success', this.translationService.translate('ORDER_DETAILS_PAYMENT_SUCCESS') || 'Payment completed successfully');
                const currentId = this.order()?.id;
                if (currentId) {
                  this.loadRemainingBalance(currentId);
                  this.facade.loadOrderDetails(currentId);
                }
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
          this.uiState.showAlert('danger', this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR'));
        }
      },
      error: (err) => {
        this.isInitiatingVendorPayment.update(prev => ({ ...prev, [vendorOrderId]: false }));
        console.error('Failed to initiate vendor order payment:', err);
        this.uiState.showAlert('danger', err.error?.message || this.translationService.translate('ORDER_DETAILS_PAYMENT_INIT_ERROR'));
      }
    });
  }

  getMilestonesForVendorOrder(vo: any): any[] {
    const breakdown = this.remainingBalanceDetails();
    if (!breakdown || !breakdown.milestones) return [];
    return breakdown.milestones.filter((m: any) => {
      if (m.vendorOrderId.toString() !== vo.id?.toString()) return false;
      return m.isPaid || this.isMilestoneDue(vo, m);
    });
  }

  isMilestoneDue(vo: any, milestone: any): boolean {
    if (milestone.isPaid) return false;
    return this.normalizeStatus(milestone.milestoneStatus) === vo.status &&
      (vo.status === 'pending_payment' || vo.status === 'shipped' || vo.status === 'delivered');
  }

  onShareTransformation(): void {
    const orderId = this.order()?.id;
    if (orderId) {
      this.router.navigate(['/share-transformation'], { queryParams: { orderId } });
    }
  }



  onPayApprovedOrders(): void {
    const orderData = this.order();
    if (!orderData) return;

    if (this.amountToPay() <= 0) {
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
        if (res && res.paymentUrl) {
          this.paymentService.startPaymentFlow(res.paymentUrl, Number(orderData.id)).subscribe({
            next: (paymentRes) => {
              this.isInitiatingPayment.set(false);
              if (paymentRes.success) {
                this.uiState.showAlert('success', this.translationService.translate('ORDER_DETAILS_PAYMENT_SUCCESS') || 'Payment completed successfully');
                this.loadRemainingBalance(orderData.id);
                this.facade.loadOrderDetails(orderData.id);
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
    const order = this.order();
    console.log('[EditOrder] Raw order object:', order);
    console.log('[EditOrder] Master items:', order?.items);
    console.log('[EditOrder] Vendor orders:', order?.vendorOrders);

    let items = order?.items ?? [];

    // When backend distributes items into vendor sub-orders,
    // the master-level items array may be empty.
    // Aggregate from vendorOrders in that case.
    if (items.length === 0 && order?.vendorOrders?.length) {
      items = order.vendorOrders.flatMap(vo => vo.items);
    }

    console.log('[EditOrder] Items for edit form:', items);
    if (items.length === 0) return;

    this.editForm = this.fb.group({
      items: this.fb.array(
        items.map((item) =>
          this.fb.nonNullable.group({
            productId: [item.productId, Validators.required],
            quantity: [item.quantity, [Validators.required, Validators.min(1), Validators.max(99)]],
            productName: [item.productName || ''],
            productNameEn: [item.productNameEn || item.productName || ''],
            productNameAr: [item.productNameAr || item.productName || ''],
            price: [item.unitPrice || 0],
            productImage: [item.productImage ?? ''],
          })
        )
      ),
    });

    console.log('[EditOrder] Form values after build:', this.editForm?.getRawValue());
  }


  onSaveEdit(): void {
    console.log('[EditOrder] onSaveEdit triggered');
    console.log('[EditOrder] Form validity:', this.editForm?.valid);
    console.log('[EditOrder] Form values:', this.editForm?.getRawValue());

    if (this.editForm && !this.editForm.valid) {
      console.log('[EditOrder] Form validation errors:');
      const itemsArray = this.editItemsArray;
      if (itemsArray) {
        itemsArray.controls.forEach((group, idx) => {
          console.log(`[EditOrder] Item ${idx} group status:`, group.status);
          Object.keys(group.controls).forEach(key => {
            const control = group.get(key);
            if (control?.errors) {
              console.log(`[EditOrder] Item ${idx} control "${key}" errors:`, control.errors);
            }
          });
        });
      }
    }

    if (!this.editForm?.valid || !this.order()) {
      console.log('[EditOrder] Early return: form invalid or order not found');
      return;
    }

    const orderId = this.order()!.id;
    console.log('[EditOrder] Order ID:', orderId);

    const raw = this.editForm.getRawValue() as { items: { productId: number; quantity: number; productName: string; productNameEn: string; productNameAr: string; price: number; productImage: string }[] };
    const items = raw.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    console.log('[EditOrder] Submitting items payload:', items);
    if (!items || items.length === 0) {
      console.log('[EditOrder] No items to save');
      return;
    }

    this.facade.updateOrderItems(orderId, items).subscribe({
      next: (updatedOrder) => {
        console.log('[EditOrder] Save success. Mapped response order:', updatedOrder);
        if (updatedOrder) {
          this.isEditModalVisible.set(false);
          this.editForm = null;
          this.uiState.showAlert('success', this.translationService.translate('ORDER_DETAILS_EDIT_SUCCESS'));
        }
      },
      error: (err) => {
        console.error('[EditOrder] Save error occurred:', err);
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
