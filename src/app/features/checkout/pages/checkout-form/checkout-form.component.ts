import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { CheckoutService, ICheckoutPayload } from '../../services/checkout.service';
import { CartService } from '../../../cart/services/cart.service';
import { phoneValidator } from '../../../../shared/validators/phone.validator';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { LOCAL_STORAGE_KEYS } from '../../../../core/constants';
import { EMPTY, defer, from, Subject } from 'rxjs';
import { catchError, exhaustMap, finalize, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-checkout-form-page',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, CurrencyFormatPipe, RtlDirective],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.css'
})
export class CheckoutFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private cartService = inject(CartService);
  private translationService = inject(TranslationService);
  private uiState = inject(UiState);

  readonly currentLang = this.translationService.currentLang;
  readonly cartItems = this.cartService.items;
  readonly cartTotals = this.cartService.totals;
  readonly cartEmpty = computed(() => this.cartItems().length === 0);

  private readonly destroyRef = inject(DestroyRef);
  private readonly submitCheckoutAction = new Subject<void>();

  readonly cartSummary = computed(() => {
    const totals = this.cartTotals();
    const discount = totals.discountAmount;
    const total = Math.max(
      0,
      Number(
        (
          totals.totalPrice +
          totals.shippingCost +
          totals.taxAmount -
          discount
        ).toFixed(2)
      )
    );

    return {
      subtotal: totals.totalPrice,
      discount,
      total,
      totalQuantity: totals.totalQuantity,
    };
  });

  checkoutForm!: FormGroup<{
    fullName: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
    addressLine1: FormControl<string>;
    addressLine2: FormControl<string>;
    city: FormControl<string>;
    zipCode: FormControl<string>;
    country: FormControl<string>;
    paymentProvider: FormControl<'paymob'>;
    orderNotes: FormControl<string>;
  }>;
  submitting = false;

  ngOnInit(): void {
    this.checkoutForm = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator()]],
      addressLine1: ['', [Validators.required]],
      addressLine2: [''],
      city: ['', [Validators.required]],
      zipCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/)]],
      country: ['US', [Validators.required]],
      paymentProvider: ['paymob' as 'paymob', [Validators.required]],
      orderNotes: ['', [Validators.maxLength(300)]]
    }) as FormGroup<{
      fullName: FormControl<string>;
      email: FormControl<string>;
      phone: FormControl<string>;
      addressLine1: FormControl<string>;
      addressLine2: FormControl<string>;
      city: FormControl<string>;
      zipCode: FormControl<string>;
      country: FormControl<string>;
      paymentProvider: FormControl<'paymob'>;
      orderNotes: FormControl<string>;
    }>;

    // Production-safe checkout submission flow.
    // Verification should rely on browser Network tab counts, not console logs.
    // Expected results:
    // - exactly one POST /Order per checkout
    // - exactly one backend cart update per quantity change
    // - no repeated GET /orders/:id or syncCart bursts
    // - no duplicate requests during auth changes
    this.submitCheckoutAction.pipe(
      exhaustMap(() => this.handleCheckoutSubmit()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  get orderNotesControl(): FormControl<string> {
    return this.checkoutForm.controls.orderNotes;
  }

  onSubmit(): void {
    this.submitCheckoutAction.next();
  }

  private handleCheckoutSubmit() {
    return defer(() => {
      if (this.submitting) {
        return EMPTY;
      }

      const cartItems = this.cartService.items();

      if (!cartItems.length) {
        this.uiState.showAlert('danger', this.translationService.translate('CHECKOUT_ERROR_EMPTY_CART'));
        return EMPTY;
      }

      if (this.checkoutForm.invalid) {
        this.checkoutForm.markAllAsTouched();
        this.uiState.showAlert('danger', this.translationService.translate('CHECKOUT_ERROR_VALIDATION'));
        return EMPTY;
      }

      this.submitting = true;
      const formValues = this.checkoutForm.getRawValue();
      return from(this.cartService.awaitPendingSyncs()).pipe(
        switchMap(() => from(this.cartService.syncCartFromBackend())),
        switchMap(() => {
          if (this.cartService.items().length === 0) {
            this.uiState.showAlert('danger', this.translationService.translate('CHECKOUT_ERROR_EMPTY_CART'));
            return EMPTY;
          }

          const addressParts: string[] = [
            formValues.addressLine1,
            formValues.addressLine2,
            formValues.city,
            formValues.zipCode,
            formValues.country
          ].map((part) => part?.trim()).filter(Boolean);

          const cartSnapshot = this.cartService.items().map((item) => ({
            productId: Number(item.productId) || Number(item.id),
            quantity: item.quantity,
          }));

          const orderPayload: ICheckoutPayload = {
            ...formValues,
            address: addressParts.join(', '),
            phoneNumber: formValues.phone.trim(),
            notes: formValues.orderNotes?.trim() || null,
            items: cartSnapshot,
          };

          return this.checkoutService.submitCheckout(orderPayload);
        }),
        tap((res) => {
          if (res.success && res.paymentUrl) {
            this.cartService.clearCart();
            localStorage.removeItem(LOCAL_STORAGE_KEYS.CART);
            window.location.href = res.paymentUrl;
          } else {
            this.uiState.showAlert('danger', this.translationService.translate('CHECKOUT_ERROR_PAYMENT_INIT'));
          }
        }),
        catchError((err: HttpErrorResponse | Error) => {
          let errorMsgKey = 'CHECKOUT_ERROR_GENERIC';
          if (err instanceof HttpErrorResponse) {
            if (err.status === 0) {
              errorMsgKey = 'CHECKOUT_ERROR_NETWORK';
            } else if (err.status === 401) {
              errorMsgKey = 'CHECKOUT_ERROR_UNAUTHORIZED';
            } else if (err.status === 400 || err.status === 422) {
              errorMsgKey = 'CHECKOUT_ERROR_VALIDATION';
            }
          }
          this.uiState.showAlert('danger', this.translationService.translate(errorMsgKey));
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
        })
      );
    });
  }

}
