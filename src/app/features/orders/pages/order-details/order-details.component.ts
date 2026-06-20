import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { OrdersFacade, PaymentStatus } from '../../data-access/orders.facade';
import { OrderStatus } from '../../interfaces';
import { Button } from '../../../../shared/components/button/button.component';
import { StatusBadgeComponent, StatusBadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
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
  private translationService = inject(TranslationService);

  readonly order = computed(() => this.facade.selectedOrder());

  readonly isConfirmDialogVisible = signal(false);
  readonly isEditModalVisible = signal(false);

  editForm: FormGroup | null = null;

  constructor() {
    this.facade.connectDetailsRoute(this.route);
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

  orderStatusTone(status: OrderStatus): StatusBadgeTone {
    return this.facade.orderStatusTone(status);
  }

  paymentStatusTone(status: PaymentStatus): StatusBadgeTone {
    return this.facade.paymentStatusTone(status);
  }
}
