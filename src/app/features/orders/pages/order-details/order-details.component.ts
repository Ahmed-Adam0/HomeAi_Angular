import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { OrdersFacade, PaymentStatus } from '../../data-access/orders.facade';
import { OrderStatus } from '../../interfaces';
import { Button } from '../../../../shared/components/button/button.component';
import { StatusBadgeComponent, StatusBadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { OrderTimelineComponent } from '../../components/order-timeline/order-timeline.component';
import { ShippingInfoComponent } from '../../components/shipping-info/shipping-info.component';
import { InvoiceSummaryComponent } from '../../components/invoice-summary/invoice-summary.component';
import { OrderedItemsComponent } from '../../components/ordered-items/ordered-items.component';
import { ConfirmDialog } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    Button,
    StatusBadgeComponent,
    TranslatePipe,
    CurrencyFormatPipe,
    RtlDirective,
    OrderTimelineComponent,
    ShippingInfoComponent,
    InvoiceSummaryComponent,
    OrderedItemsComponent,
    ConfirmDialog,
    ModalComponent,
  ],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.css',
  providers: [OrdersFacade],
})
export class OrderDetails {
  private route = inject(ActivatedRoute);
  readonly facade = inject(OrdersFacade);
  private uiState = inject(UiState);
  private translationService = inject(TranslationService);

  readonly order = computed(() => this.facade.selectedOrder());

  // Dialog and modal visibility states
  readonly isConfirmDialogVisible = signal(false);
  readonly isEditModalVisible = signal(false);

  constructor() {
    this.facade.connectDetailsRoute(this.route);
  }

  /**
   * Triggers the edit order flow. Since edit is pending implementation, 
   * we present a beautiful, highly interactive placeholder modal.
   */
  onEdit(): void {
    if (this.facade.canModifyOrder()) {
      this.isEditModalVisible.set(true);
    }
  }

  /**
   * Opens the cancel order confirmation dialog.
   */
  onCancel(): void {
    if (this.facade.canModifyOrder()) {
      this.isConfirmDialogVisible.set(true);
    }
  }

  /**
   * Proceeds with order cancellation. Sends API request reactively 
   * and displays matching visual feedback via global toasts.
   */
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
      error: (err) => {
        console.error('Cancellation error', err);
        const errorMsg = this.translationService.translate('ORDER_DETAILS_CANCEL_ERROR');
        this.uiState.showAlert('danger', errorMsg);
      }
    });
  }

  closeConfirmDialog(): void {
    this.isConfirmDialogVisible.set(false);
  }

  closeEditModal(): void {
    this.isEditModalVisible.set(false);
  }

  /**
   * Delegates the status tone calculation to the facade.
   */
  orderStatusTone(status: OrderStatus): StatusBadgeTone {
    return this.facade.orderStatusTone(status);
  }

  /**
   * Delegates the payment status tone calculation to the facade.
   */
  paymentStatusTone(status: PaymentStatus): StatusBadgeTone {
    return this.facade.paymentStatusTone(status);
  }
}
