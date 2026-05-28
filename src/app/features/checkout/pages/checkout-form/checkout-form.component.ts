import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CheckoutService, ICouponValidationResult, ICouponTotalsContext } from '../../services/checkout.service';
import { CartService } from '../../../cart/services/cart.service';
import { phoneValidator } from '../../../../shared/validators/phone.validator';
import { Router } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CouponBoxComponent } from '../../components/coupon-box/coupon-box.component';
import { finalize } from 'rxjs/operators';

@Component({
  standalone: true,
  selector: 'app-checkout-form-page',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, CurrencyFormatPipe, RtlDirective, CouponBoxComponent],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.css'
})
export class CheckoutFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private cartService = inject(CartService);
  private router = inject(Router);
  private translationService = inject(TranslationService);

  readonly currentLang = this.translationService.currentLang;
  readonly cartItems = this.cartService.items;
  readonly cartTotals = this.cartService.totals;
  readonly cartEmpty = computed(() => this.cartItems().length === 0);
  readonly couponStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly couponMessage = signal('');
  readonly activeCoupon = signal<string | null>(null);
  readonly couponDiscount = signal(0);
  readonly couponSavedAmountLabel = signal('');

  readonly cartSummary = computed(() => {
    const totals = this.cartTotals();
    const discount = totals.discountAmount + this.couponDiscount();
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
      shipping: totals.shippingCost,
      tax: totals.taxAmount,
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
    shippingOption: FormControl<'standard' | 'express'>;
    paymentProvider: FormControl<'stripe' | 'paypal' | 'paymob'>;
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
      shippingOption: ['standard' as 'standard', [Validators.required]],
      paymentProvider: ['stripe' as 'stripe', [Validators.required]],
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
      shippingOption: FormControl<'standard' | 'express'>;
      paymentProvider: FormControl<'stripe' | 'paypal' | 'paymob'>;
      orderNotes: FormControl<string>;
    }>;
  }

  get orderNotesControl(): FormControl<string> {
    return this.checkoutForm.controls.orderNotes;
  }

  onSubmit(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValues = this.checkoutForm.getRawValue();

    const checkoutDetails = {
      billingDetails: {
        fullName: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        addressLine1: formValues.addressLine1,
        addressLine2: formValues.addressLine2,
        city: formValues.city,
        zipCode: formValues.zipCode,
        country: formValues.country,
      },
      shippingOption: formValues.shippingOption,
      paymentProvider: formValues.paymentProvider,
      orderNotes: formValues.orderNotes,
      couponCode: this.activeCoupon() ?? undefined,
    };

    this.checkoutService.submitCheckout(checkoutDetails).pipe(
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.cartService.clearCart();
          this.router.navigate(['/payment']);
        }
      },
      error: () => {
        // preserve existing behavior if submission fails
      }
    });
  }

  onApplyCoupon(code: string): void {
    const totals: ICouponTotalsContext = {
      subtotal: this.cartTotals().totalPrice,
      shippingCost: this.cartTotals().shippingCost,
      taxAmount: this.cartTotals().taxAmount,
      total: this.cartTotals().grandTotal,
    };

    this.couponStatus.set('loading');
    this.couponMessage.set('');

    this.checkoutService.validateCoupon(code, totals).pipe(
      finalize(() => {
        if (this.couponStatus() === 'loading') {
          this.couponStatus.set('idle');
        }
      })
    ).subscribe({
      next: (result: ICouponValidationResult) => {
        if (result.valid) {
          this.activeCoupon.set(code);
          this.couponDiscount.set(result.discountAmount);
          this.couponSavedAmountLabel.set(result.savedAmountKey ?? '');
          this.couponMessage.set(result.messageKey);
          this.couponStatus.set('success');
        } else {
          this.activeCoupon.set(null);
          this.couponDiscount.set(0);
          this.couponSavedAmountLabel.set('');
          this.couponMessage.set(result.messageKey);
          this.couponStatus.set('error');
        }
      },
      error: () => {
        this.activeCoupon.set(null);
        this.couponDiscount.set(0);
        this.couponSavedAmountLabel.set('');
        this.couponMessage.set('CHECKOUT_COUPON_GENERIC_ERROR');
        this.couponStatus.set('error');
      }
    });
  }

  onRemoveCoupon(): void {
    this.activeCoupon.set(null);
    this.couponDiscount.set(0);
    this.couponSavedAmountLabel.set('');
    this.couponMessage.set('');
    this.couponStatus.set('idle');
  }
}
