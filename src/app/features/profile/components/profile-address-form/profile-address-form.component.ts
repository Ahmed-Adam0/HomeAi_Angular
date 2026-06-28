import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { IAddressDto } from '../../interfaces/iaddress.dto';

@Component({
  selector: 'app-profile-address-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective, AutoDirectionDirective],
  template: `
    <div appRtl class="address-form-container p-4 rounded-4 mb-3">
      <h4 class="h6 font-bold tracking-tight mb-3">
        {{ (address ? 'PROFILE.EDIT_ADDRESS' : 'PROFILE.ADD_ADDRESS') | translate }}
      </h4>

      <form [formGroup]="addressForm" (ngSubmit)="onSubmit()" class="row g-3">
        <!-- Label -->
        <div class="col-12 col-md-6">
          <label class="form-label font-semibold small mb-1" for="label">
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
              formControlName="label"
              appAutoDir />
          </div>
        </div>

        <!-- Address Line 1 -->
        <div class="col-12 col-md-6">
          <label class="form-label font-semibold small mb-1" for="addressLine1">
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
              formControlName="addressLine1"
              appAutoDir />
          </div>
          <div class="invalid-feedback d-block mt-1" *ngIf="addressLine1Control.invalid && addressLine1Control.touched">
            {{ 'PROFILE.STREET_ADDRESS' | translate }} is required.
          </div>
        </div>

        <!-- Address Line 2 -->
        <div class="col-12 col-md-6">
          <label class="form-label font-semibold small mb-1" for="addressLine2">
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
              formControlName="addressLine2"
              appAutoDir />
          </div>
        </div>

        <!-- City -->
        <div class="col-12 col-md-6">
          <label class="form-label font-semibold small mb-1" for="city">
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
              formControlName="city"
              appAutoDir />
          </div>
          <div class="invalid-feedback d-block mt-1" *ngIf="cityControl.invalid && cityControl.touched">
            {{ 'PROFILE.CITY' | translate }} is required.
          </div>
        </div>

        <!-- Country -->
        <div class="col-12 col-md-6">
          <label class="form-label font-semibold small mb-1" for="country">
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
              formControlName="country"
              appAutoDir />
          </div>
          <div class="invalid-feedback d-block mt-1" *ngIf="countryControl.invalid && countryControl.touched">
            {{ 'PROFILE.COUNTRY' | translate }} is required.
          </div>
        </div>

        <!-- Postal Code -->
        <div class="col-12 col-md-6">
          <label class="form-label font-semibold small mb-1" for="postalCode">
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
              formControlName="postalCode"
              appAutoDir />
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
            <label class="form-check-label font-bold small pointer ms-2" for="primary">
              {{ 'PROFILE.SET_DEFAULT' | translate }}
            </label>
          </div>
        </div>

        <!-- Buttons -->
        <div class="col-12 d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
          <button
            type="button"
            class="btn btn-sm btn-cancel rounded-pill px-3"
            (click)="cancel.emit()">
            {{ 'PROFILE.CANCEL_ADDRESS' | translate }}
          </button>
          <button
            type="submit"
            class="btn btn-sm btn-save-addr rounded-pill px-4"
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
      h4 {
        color: var(--fm-text-heading);
      }
      label {
        color: var(--fm-text-muted);
      }
      .form-check-label {
        color: var(--fm-text-body);
      }
      .address-form-container {
        border: 1px solid var(--fm-border-medium) !important;
        background-color: var(--fm-color-neutral-100) !important;
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        box-shadow: var(--fm-shadow-md);
      }
      .premium-input {
        border-radius: var(--fm-radius-lg);
        border: 1px solid var(--fm-input-border);
        background-color: var(--fm-input-bg);
        font-size: 0.9rem;
        height: 44px;
        transition: var(--fm-transition-smooth);
        color: var(--fm-text-body);
      }
      .premium-input:focus {
        border-color: var(--fm-input-focus-border);
        background-color: var(--fm-input-bg);
        box-shadow: 0 0 0 4px var(--fm-input-focus-ring);
        outline: none;
      }
      .input-icon-left {
        z-index: 4;
        display: flex;
        align-items: center;
        font-size: 1rem;
      }
      .pointer {
        cursor: pointer;
      }
      .form-switch .form-check-input {
        height: 1.25rem;
        width: 2.25rem;
        border-color: var(--fm-color-neutral-300);
      }
      .form-switch .form-check-input:checked {
        background-color: var(--fm-color-primary-500);
        border-color: var(--fm-color-primary-500);
      }
      .btn-cancel {
        border: 1px solid var(--fm-color-neutral-300);
        color: var(--fm-text-body);
        font-weight: 600;
        background-color: transparent;
        transition: var(--fm-transition-smooth);
      }
      .btn-cancel:hover {
        background-color: var(--fm-color-neutral-800);
        border-color: var(--fm-color-neutral-800);
        color: var(--fm-text-inverted);
      }
      .btn-save-addr {
        background-color: var(--fm-color-neutral-800);
        color: var(--fm-text-inverted);
        border: 1px solid var(--fm-color-neutral-800);
        font-weight: 600;
        transition: var(--fm-transition-smooth);
      }
      .btn-save-addr:hover {
        background-color: var(--fm-color-primary-500);
        border-color: var(--fm-color-primary-500);
        color: var(--fm-text-inverted);
        box-shadow: 0 6px 15px var(--fm-color-primary-glow);
        transform: translateY(-1px);
      }
      .btn-save-addr:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .invalid-feedback {
        font-size: 0.8rem;
        color: var(--fm-color-danger-500);
        font-weight: 500;
      }
      .premium-input {
        padding-inline-start: 3rem !important;
        padding-inline-end: 1rem !important;
      }
      .input-icon-left {
        inset-inline-start: 1rem !important;
        inset-inline-end: auto !important;
      }
      .border-top {
        border-top: 1px solid var(--fm-border-medium) !important;
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
