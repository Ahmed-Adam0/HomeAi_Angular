import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { CheckoutService, ICheckoutPayload, ICheckoutResult } from '../../services/checkout.service';
import { CartService } from '../../../cart/services/cart.service';
import { ProfileService } from '../../../profile/services/profile.service';
import { IProfile } from '../../../profile/interfaces/iprofile';
import { IAddressDto } from '../../../profile/interfaces/iaddress.dto';
import { phoneValidator } from '../../../../shared/validators/phone.validator';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { LOCAL_STORAGE_KEYS } from '../../../../core/constants';
import { EMPTY, defer, from, Subject } from 'rxjs';
import { catchError, exhaustMap, finalize, switchMap, tap } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-checkout-form-page',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, CurrencyFormatPipe, RtlDirective, AutoDirectionDirective],
  templateUrl: './checkout-form.component.html',
  styleUrl: './checkout-form.component.css'
})
export class CheckoutFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private cartService = inject(CartService);
  private translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private router = inject(Router);
  private profileService = inject(ProfileService);

  readonly currentLang = this.translationService.currentLang;
  readonly cartItems = this.cartService.items;
  readonly cartTotals = this.cartService.totals;
  readonly cartEmpty = computed(() => this.cartItems().length === 0);

  private readonly destroyRef = inject(DestroyRef);
  private readonly submitCheckoutAction = new Subject<void>();

  readonly profile = signal<IProfile | null>(null);
  readonly savedAddresses = signal<IAddressDto[]>([]);
  readonly selectedAddressId = signal<string | null>(null);
  readonly showAddAddressForm = signal<boolean>(false);
  readonly addressSaving = signal<boolean>(false);

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
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
    paymentProvider: FormControl<'paymob'>;
    orderNotes: FormControl<string>;
  }>;
  submitting = false;

  newAddressForm!: FormGroup<{
    label: FormControl<string>;
    buildingNumber: FormControl<string>;
    street: FormControl<string>;
    area: FormControl<string>;
    city: FormControl<string>;
    country: FormControl<string>;
    notes: FormControl<string>;
    addressLine1: FormControl<string>;
    addressLine2: FormControl<string>;
    postalCode: FormControl<string>;
    primary: FormControl<boolean>;
  }>;

  ngOnInit(): void {
    this.checkoutForm = this.fb.nonNullable.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, phoneValidator()]],
      paymentProvider: ['paymob' as 'paymob', [Validators.required]],
      orderNotes: ['', [Validators.maxLength(300)]]
    }) as FormGroup<{
      firstName: FormControl<string>;
      lastName: FormControl<string>;
      email: FormControl<string>;
      phone: FormControl<string>;
      paymentProvider: FormControl<'paymob'>;
      orderNotes: FormControl<string>;
    }>;

    this.newAddressForm = this.fb.nonNullable.group({
      label: ['', []],
      buildingNumber: ['', [Validators.required]],
      street: ['', [Validators.required]],
      area: ['', [Validators.required]],
      city: ['', [Validators.required]],
      country: ['Egypt', [Validators.required]],
      notes: ['', []],
      addressLine1: ['', []],
      addressLine2: [''],
      postalCode: [''],
      primary: [false, []]
    }) as FormGroup<{
      label: FormControl<string>;
      buildingNumber: FormControl<string>;
      street: FormControl<string>;
      area: FormControl<string>;
      city: FormControl<string>;
      country: FormControl<string>;
      notes: FormControl<string>;
      addressLine1: FormControl<string>;
      addressLine2: FormControl<string>;
      postalCode: FormControl<string>;
      primary: FormControl<boolean>;
    }>;

    // Sync buildingNumber and street with addressLine1 on newAddressForm
    this.newAddressForm.valueChanges.subscribe(values => {
      const bld = values.buildingNumber || '';
      const str = values.street || '';
      const constructedLine1 = `${bld} ${str}`.trim();
      if (this.newAddressForm.controls.addressLine1.value !== constructedLine1) {
        this.newAddressForm.controls.addressLine1.setValue(constructedLine1, { emitEvent: false });
      }
    });

    // Load profile and addresses on initialization
    this.loadProfileAndAddresses();

    // Production-safe checkout submission flow.
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

  loadProfileAndAddresses(): void {
    this.profileService.getProfile().pipe(
      tap((profile) => {
        this.profile.set(profile);

        // Prefill contact fields if not already modified
        if (profile.fullName) {
          const parts = profile.fullName.trim().split(/\s+/);
          const first = parts[0] || '';
          const last = parts.slice(1).join(' ') || '';
          this.checkoutForm.patchValue({
            firstName: this.checkoutForm.value.firstName || first,
            lastName: this.checkoutForm.value.lastName || last
          });
        }
        if (profile.email) {
          this.checkoutForm.patchValue({
            email: this.checkoutForm.value.email || profile.email
          });
        }
        if (profile.phoneNumber) {
          this.checkoutForm.patchValue({
            phone: this.checkoutForm.value.phone || profile.phoneNumber
          });
        }

        // Sort addresses by creation date ascending (oldest first).
        let addresses = profile.addresses || [];
        addresses = [...addresses].sort((a, b) => this.getAddressSortValue(a) - this.getAddressSortValue(b));

        this.savedAddresses.set(addresses);

        if (addresses.length > 0) {
          // If a default address exists, select it automatically.
          // Otherwise, select the oldest address automatically.
          const defaultAddr = addresses.find(a => a.primary);
          if (defaultAddr) {
            this.selectAddress(defaultAddr);
          } else {
            this.selectAddress(addresses[0]);
          }
          this.showAddAddressForm.set(false);
        } else {
          this.showAddAddressForm.set(true);
        }
      }),
      catchError((err) => {
        console.error('Failed to load profile details for checkout', err);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  selectAddress(address: IAddressDto): void {
    this.selectedAddressId.set(address.id || null);
  }

  private getAddressSortValue(addr: IAddressDto): number {
    const id = addr.id;
    if (id === null || id === undefined) return Infinity;
    if (typeof id === 'number') return id;
    const num = Number(id);
    if (!isNaN(num)) return num;
    const match = String(id).match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }

  toggleAddAddressForm(): void {
    const isShowing = this.showAddAddressForm();
    if (isShowing) {
      this.cancelAddAddress();
    } else {
      this.showAddAddressForm.set(true);
    }
  }

  cancelAddAddress(): void {
    this.showAddAddressForm.set(false);
    this.newAddressForm.reset({
      label: '',
      buildingNumber: '',
      street: '',
      area: '',
      city: '',
      country: 'Egypt',
      notes: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      primary: false
    });
    // Reselect the previously selected or default address if exists
    if (this.savedAddresses().length > 0) {
      const selected = this.savedAddresses().find(a => a.id === this.selectedAddressId()) || this.savedAddresses()[0];
      this.selectAddress(selected);
    }
  }

  onSaveNewAddress(): void {
    if (this.newAddressForm.invalid || this.addressSaving()) {
      this.newAddressForm.markAllAsTouched();
      return;
    }

    this.addressSaving.set(true);
    const formValue = this.newAddressForm.value;
    const newAddr: IAddressDto = {
      id: 'addr_' + Date.now().toString(),
      label: formValue.label || undefined,
      buildingNumber: formValue.buildingNumber || '',
      street: formValue.street || '',
      area: formValue.area || '',
      city: formValue.city || '',
      country: formValue.country || 'Egypt',
      notes: formValue.notes || '',
      addressLine1: formValue.addressLine1 || '',
      addressLine2: formValue.addressLine2 || undefined,
      postalCode: formValue.postalCode || undefined,
      primary: !!formValue.primary
    };

    const currentProfile = this.profile();
    if (!currentProfile) {
      this.uiState.showAlert('danger', this.translationService.translate('CHECKOUT_ERROR_GENERIC'));
      this.addressSaving.set(false);
      return;
    }

    // If marked primary, set all other addresses' primary flag to false
    let updatedAddresses = currentProfile.addresses || [];
    if (newAddr.primary) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, primary: false }));
    } else if (updatedAddresses.length === 0) {
      // If it's the first address, make it primary
      newAddr.primary = true;
    }

    updatedAddresses = [...updatedAddresses, newAddr];

    this.profileService.updateProfile({
      fullName: currentProfile.fullName,
      preferredLanguage: currentProfile.preferredLanguage || 'en',
      email: currentProfile.email,
      phoneNumber: currentProfile.phoneNumber || null,
      profileImage: currentProfile.profileImage || null,
      userName: currentProfile.userName || null,
      addresses: updatedAddresses
    }).pipe(
      tap((updatedProfile) => {
        this.uiState.showAlert('success', this.translationService.translate('PROFILE.SAVE_ADDRESS_SUCCESS') || 'Address saved successfully');

        // Refresh profile and addresses
        this.profile.set(updatedProfile);

        // Sort addresses
        let sortedAddresses = updatedProfile.addresses || [];
        sortedAddresses = [...sortedAddresses].sort((a, b) => this.getAddressSortValue(a) - this.getAddressSortValue(b));

        this.savedAddresses.set(sortedAddresses);

        // Find the newly created address from the updated list
        const addedAddr = sortedAddresses.find(a => a.addressLine1 === newAddr.addressLine1 && a.city === newAddr.city) || newAddr;

        // Auto select the new address
        this.selectAddress(addedAddr);

        // Reset form and close
        this.newAddressForm.reset({
          label: '',
          buildingNumber: '',
          street: '',
          area: '',
          city: '',
          country: 'Egypt',
          notes: '',
          addressLine1: '',
          addressLine2: '',
          postalCode: '',
          primary: false
        });
        this.showAddAddressForm.set(false);
      }),
      catchError((err) => {
        console.error('Failed to save new address to profile during checkout', err);
        this.uiState.showAlert('danger', this.translationService.translate('CHECKOUT_PROFILE_ADDRESS_WARNING'));
        return EMPTY;
      }),
      finalize(() => {
        this.addressSaving.set(false);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
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

      const selectedAddr = this.savedAddresses().find(a => a.id === this.selectedAddressId());
      if (!selectedAddr) {
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
            selectedAddr.addressLine1 || '',
            selectedAddr.addressLine2 || '',
            selectedAddr.area || '',
            selectedAddr.city || '',
            selectedAddr.country || ''
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
            addressId: selectedAddr.id || undefined,
            addressLine1: selectedAddr.addressLine1,
            addressLine2: selectedAddr.addressLine2,
            city: selectedAddr.city,
            country: selectedAddr.country
          };

          return this.checkoutService.submitCheckout(orderPayload);
        }),
        tap((res: ICheckoutResult) => {
          if (res.success) {
            if (!res.profileAddressSaved) {
              this.uiState.showAlert('warning', this.translationService.translate('CHECKOUT_PROFILE_ADDRESS_WARNING'));
            }
            this.cartService.clearCart();
            localStorage.removeItem(LOCAL_STORAGE_KEYS.CART);
            if (res.paymentUrl) {
              window.location.href = res.paymentUrl;
            } else {
              this.uiState.showAlert('success', this.translationService.translate('CHECKOUT_SUCCESS_ORDER_PLACED'));
              this.router.navigate(['/orders', res.orderId]);
            }
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
