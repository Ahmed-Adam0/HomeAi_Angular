import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { IAddressDto } from '../../interfaces/iaddress.dto';

@Component({
  selector: 'app-profile-address-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective],
  template: `
    <div appRtl class="address-form-container p-4 rounded-4 border bg-white mb-3">
      <h4 class="h6 text-dark font-semibold mb-3">
        {{ (address ? 'PROFILE.EDIT_ADDRESS' : 'PROFILE.ADD_ADDRESS') | translate }}
      </h4>

      <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="row g-3">
        <!-- Label -->
        <div class="col-12 col-md-6">
          <label class="form-label font-medium text-dark small mb-1" for="label">
            {{ 'PROFILE.ADDRESS_LABEL' | translate }}
          </label>
          <div class="input-container position-relative">
            <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
              <i class="bi bi-tag"></i>
            </span>
            <input
              id="label"
              class="form-control premium-input ps-5"
              type="text"
              placeholder="e.g. Home, Work"
              formControlName="label" />
          </div>
        </div>

        <!-- Address Line 1 -->
        <div class="col-12 col-md-6">
          <label class="form-label font-medium text-dark small mb-1" for="addressLine1">
            {{ 'PROFILE.STREET_ADDRESS' | translate }} *
          </label>
          <div class="input-container position-relative">
            <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
              <i class="bi bi-geo-alt"></i>
            </span>
            <input
              id="addressLine1"
              class="form-control premium-input ps-5"
              [class.is-invalid]="addressLine1Control.invalid && addressLine1Control.touched"
              type="text"
              formControlName="addressLine1" />
          </div>
          <div class="invalid-feedback d-block mt-1" *ngIf="addressLine1Control.invalid && addressLine1Control.touched">
            {{ 'PROFILE.STREET_ADDRESS' | translate }} is required.
          </div>
        </div>

        <!-- Address Line 2 -->
        <div class="col-12 col-md-6">
          <label class="form-label font-medium text-dark small mb-1" for="addressLine2">
            {{ 'PROFILE.APT_SUITE' | translate }}
          </label>
          <div class="input-container position-relative">
            <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
              <i class="bi bi-building"></i>
            </span>
            <input
              id="addressLine2"
              class="form-control premium-input ps-5"
              type="text"
              formControlName="addressLine2" />
          </div>
        </div>

        <!-- City -->
        <div class="col-12 col-md-6">
          <label class="form-label font-medium text-dark small mb-1" for="city">
            {{ 'PROFILE.CITY' | translate }} *
          </label>
          <div class="input-container position-relative">
            <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
              <i class="bi bi-map"></i>
            </span>
            <input
              id="city"
              class="form-control premium-input ps-5"
              [class.is-invalid]="cityControl.invalid && cityControl.touched"
              type="text"
              formControlName="city" />
          </div>
          <div class="invalid-feedback d-block mt-1" *ngIf="cityControl.invalid && cityControl.touched">
            {{ 'PROFILE.CITY' | translate }} is required.
          </div>
        </div>

        <!-- Country -->
        <div class="col-12 col-md-6">
          <label class="form-label font-medium text-dark small mb-1" for="country">
            {{ 'PROFILE.COUNTRY' | translate }} *
          </label>
          <div class="input-container position-relative">
            <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
              <i class="bi bi-globe"></i>
            </span>
            <input
              id="country"
              class="form-control premium-input ps-5"
              [class.is-invalid]="countryControl.invalid && countryControl.touched"
              type="text"
              formControlName="country" />
          </div>
          <div class="invalid-feedback d-block mt-1" *ngIf="countryControl.invalid && countryControl.touched">
            {{ 'PROFILE.COUNTRY' | translate }} is required.
          </div>
        </div>

        <!-- Postal Code -->
        <div class="col-12 col-md-6">
          <label class="form-label font-medium text-dark small mb-1" for="postalCode">
            {{ 'PROFILE.POSTAL_CODE' | translate }}
          </label>
          <div class="input-container position-relative">
            <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
              <i class="bi bi-mailbox"></i>
            </span>
            <input
              id="postalCode"
              class="form-control premium-input ps-5"
              type="text"
              formControlName="postalCode" />
          </div>
        </div>

        <!-- Primary Checkbox -->
        <div class="col-12 d-flex align-items-center">
          <div class="form-check form-switch pt-2">
            <input
              id="primary"
              type="checkbox"
              class="form-check-input pointer"
              formControlName="primary" />
            <label class="form-check-label font-semibold text-dark small pointer ms-2" for="primary">
              {{ 'PROFILE.SET_DEFAULT' | translate }}
            </label>
          </div>
        </div>

        <!-- Buttons -->
        <div class="col-12 d-flex justify-content-end gap-3 mt-4 pt-2 border-top">
          <button
            type="button"
            class="btn btn-sm btn-outline rounded-pill px-3"
            (click)="cancel.emit()">
            {{ 'PROFILE.CANCEL_ADDRESS' | translate }}
          </button>
          <button
            type="submit"
            class="btn btn-sm btn-dark rounded-pill px-4"
            [disabled]="submitting || addressForm.invalid">
            <span *ngIf="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            {{ 'PROFILE.SAVE_ADDRESS' | translate }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [
    `
      .address-form-container {
        border: 1px solid var(--fm-glass-border) !important;
        background-color: var(--fm-surface-card);
        box-shadow: var(--fm-shadow-md);
      }
      .premium-input {
        border-radius: var(--fm-radius-lg);
        border: 1px solid var(--fm-input-border);
        background-color: var(--fm-input-bg);
        font-size: 0.9rem;
        height: 44px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        color: var(--fm-color-neutral-800);
      }
      .premium-input:focus {
        border-color: var(--fm-input-focus-border);
        box-shadow: 0 0 0 4px var(--fm-input-focus-ring);
        outline: none;
      }
      .input-icon-left {
        z-index: 4;
        display: flex;
        align-items: center;
      }
      .pointer {
        cursor: pointer;
      }
      .form-switch .form-check-input:checked {
        background-color: var(--fm-color-primary-500);
        border-color: var(--fm-color-primary-500);
      }
      :host-context([dir='rtl']) .premium-input {
        padding-left: 1rem !important;
        padding-right: 3rem !important;
      }
      :host-context([dir='rtl']) .input-icon-left {
        left: auto !important;
        right: 0 !important;
        margin-right: 1rem !important;
        margin-left: 0 !important;
      }
    `
  ]
})
export class ProfileAddressForm implements OnChanges {
  @Input() address: IAddressDto | null = null;
  @Input() submitting = false;
  @Output() saveAddress = new EventEmitter<IAddressDto>();
  @Output() cancel = new EventEmitter<void>();

  private formBuilder = new FormBuilder();

  readonly addressForm = this.formBuilder.group({
    label: ['', []],
    addressLine1: ['', [Validators.required]],
    addressLine2: ['', []],
    city: ['', [Validators.required]],
    country: ['', [Validators.required]],
    postalCode: ['', []],
    primary: [false, []],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['address']) {
      if (this.address) {
        this.addressForm.patchValue({
          label: this.address.label ?? '',
          addressLine1: this.address.addressLine1,
          addressLine2: this.address.addressLine2 ?? '',
          city: this.address.city ?? '',
          country: this.address.country ?? '',
          postalCode: this.address.postalCode ?? '',
          primary: !!this.address.primary,
        });
      } else {
        this.addressForm.reset({
          label: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          country: '',
          postalCode: '',
          primary: false,
        });
      }
    }
  }

  get addressLine1Control() {
    return this.addressForm.get('addressLine1')!;
  }

  get cityControl() {
    return this.addressForm.get('city')!;
  }

  get countryControl() {
    return this.addressForm.get('country')!;
  }

  onSubmit(): void {
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const value = this.addressForm.value;
    const result: IAddressDto = {
      id: this.address?.id,
      label: value.label || undefined,
      addressLine1: value.addressLine1 as string,
      addressLine2: value.addressLine2 || undefined,
      city: value.city || undefined,
      country: value.country || undefined,
      postalCode: value.postalCode || undefined,
      primary: !!value.primary,
    };

    this.saveAddress.emit(result);
  }
}
