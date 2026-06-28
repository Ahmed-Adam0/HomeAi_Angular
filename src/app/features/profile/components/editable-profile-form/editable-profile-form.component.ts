import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { IProfile } from '../../interfaces/iprofile';
import { IUpdateProfileDto } from '../../interfaces/iupdate-profile.dto';

@Component({
  selector: 'app-editable-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective, AutoDirectionDirective],
  template: `
    <div appRtl class="profile-form-card">
      <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
        <!-- Header -->
        <div class="d-flex align-items-center justify-content-between mb-4">
          <h3 class="personal-info-title mb-0">{{ 'PROFILE.PERSONAL_INFORMATION' | translate }}</h3>
          <!-- Edit/Cancel Button -->
          <button type="button" class="btn btn-edit-profile d-flex align-items-center gap-1.5 rounded-pill px-3 py-1.5" (click)="toggleEditMode()">
            <i class="bi" [class.bi-pencil]="!isEditMode()" [class.bi-x-lg]="isEditMode()"></i>
            <span>{{ isEditMode() ? ('PROFILE.CANCEL' | translate) : ('PROFILE.EDIT' | translate) }}</span>
          </button>
        </div>

        <!-- Read-only View: Staggered animated layout -->
        <ng-container *ngIf="!isEditMode(); else editFields">
          <div class="personal-info-list d-flex flex-column gap-2">
            <!-- Full Name -->
            <div class="info-list-item d-flex align-items-center p-3 animate-item" style="--i:0">
              <div class="info-icon-circle d-flex align-items-center justify-content-center">
                <i class="bi bi-person"></i>
              </div>
              <div class="info-content-flex flex-grow-1 ms-3">
                <span class="info-label-block">{{ 'PROFILE.FULL_NAME' | translate }}</span>
                <span class="info-value-block">{{ profile?.fullName || 'N/A' }}</span>
              </div>
            </div>

            <!-- Email -->
            <div class="info-list-item d-flex align-items-center p-3 animate-item" style="--i:1">
              <div class="info-icon-circle d-flex align-items-center justify-content-center">
                <i class="bi bi-envelope"></i>
              </div>
              <div class="info-content-flex flex-grow-1 ms-3">
                <span class="info-label-block">{{ 'PROFILE.EMAIL' | translate }}</span>
                <span class="info-value-block text-truncate" style="max-width: 280px;">{{ profile?.email || 'N/A' }}</span>
              </div>
            </div>

            <!-- Phone -->
            <div class="info-list-item d-flex align-items-center p-3 animate-item" style="--i:2">
              <div class="info-icon-circle d-flex align-items-center justify-content-center">
                <i class="bi bi-telephone"></i>
              </div>
              <div class="info-content-flex flex-grow-1 ms-3">
                <span class="info-label-block">{{ 'PROFILE.PHONE' | translate }}</span>
                <span class="info-value-block">{{ profile?.phoneNumber || 'N/A' }}</span>
              </div>
            </div>

            <!-- Preferred Language -->
            <div class="info-list-item d-flex align-items-center p-3 animate-item" style="--i:3">
              <div class="info-icon-circle d-flex align-items-center justify-content-center">
                <i class="bi bi-globe"></i>
              </div>
              <div class="info-content-flex flex-grow-1 ms-3">
                <span class="info-label-block">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</span>
                <span class="info-value-block">
                  {{ profile?.preferredLanguage === 'ar' ? ('PROFILE.LANG_ARABIC' | translate) : ('PROFILE.LANG_ENGLISH' | translate) }}
                </span>
              </div>
            </div>

            <!-- Default Address -->
            <div class="info-list-item d-flex align-items-center p-3 animate-item" style="--i:4">
              <div class="info-icon-circle d-flex align-items-center justify-content-center">
                <i class="bi bi-geo-alt"></i>
              </div>
              <div class="info-content-flex flex-grow-1 ms-3">
                <span class="info-label-block">{{ 'PROFILE.ADDRESS' | translate }}</span>
                <span class="info-value-block">{{ formattedAddress }}</span>
              </div>
            </div>
          </div>
        </ng-container>

        <!-- Edit View: Fields Grid -->
        <ng-template #editFields>
          <div class="row g-4 edit-fields-container animate-fade-in">
            <!-- Full Name -->
            <div class="col-12 col-md-6">
              <label class="form-label font-semibold small mb-2" for="fullName">{{ 'PROFILE.FULL_NAME' | translate }}</label>
              <div class="input-container position-relative">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-person"></i>
                </span>
                <input
                  id="fullName"
                  class="form-control premium-input ps-5"
                  [class.is-invalid]="fullName.invalid && fullName.touched"
                  type="text"
                  formControlName="fullName"
                  appAutoDir />
              </div>
              <div class="invalid-feedback d-block mt-1" *ngIf="fullName.invalid && fullName.touched">
                {{ 'PROFILE.FULL_NAME' | translate }} is required.
              </div>
            </div>

            <!-- Email -->
            <div class="col-12 col-md-6">
              <label class="form-label font-semibold small mb-2" for="email">{{ 'PROFILE.EMAIL' | translate }}</label>
              <div class="input-container position-relative">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-envelope"></i>
                </span>
                <input
                  id="email"
                  class="form-control premium-input ps-5"
                  [class.is-invalid]="email.invalid && email.touched"
                  [class.disabled-email-input]="email.disabled"
                  [class.pe-5]="email.disabled"
                  type="email"
                  formControlName="email"
                  appAutoDir />
                <span *ngIf="email.disabled" class="input-icon-right position-absolute top-50 end-0 translate-middle-y me-3 text-muted">
                  <i class="bi bi-lock-fill"></i>
                </span>
              </div>
              <div class="invalid-feedback d-block mt-1" *ngIf="email.invalid && email.touched">
                <ng-container *ngIf="email.hasError('required')">
                  {{ 'PROFILE.EMAIL_REQUIRED' | translate }}
                </ng-container>
                <ng-container *ngIf="email.hasError('email')">
                  {{ 'PROFILE.EMAIL_INVALID' | translate }}
                </ng-container>
              </div>
              <div *ngIf="email.disabled" class="form-text text-muted small mt-2 d-flex align-items-center gap-1.5 google-email-help">
                <i class="bi bi-info-circle text-primary"></i>
                <span>{{ 'PROFILE.GOOGLE_EMAIL_HELP' | translate }}</span>
              </div>
            </div>

            <!-- Phone -->
            <div class="col-12 col-md-6">
              <label class="form-label font-semibold small mb-2" for="phoneNumber">{{ 'PROFILE.PHONE' | translate }}</label>
              <div class="input-container position-relative">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-telephone"></i>
                </span>
                <input
                  id="phoneNumber"
                  class="form-control premium-input ps-5"
                  type="tel"
                  formControlName="phoneNumber"
                  appAutoDir />
              </div>
            </div>

            <!-- Preferred Language -->
            <div class="col-12 col-md-6">
              <label class="form-label font-semibold small mb-2" for="preferredLanguage">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</label>
              <div class="input-container position-relative">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-translate"></i>
                </span>
                <select id="preferredLanguage" class="form-select premium-input ps-5" formControlName="preferredLanguage">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Edit Action Buttons -->
          <div class="mt-4 pt-2 d-flex justify-content-end gap-3">
            <button type="submit" class="btn btn-save-profile btn-md btn-rounded px-4 py-2" [disabled]="submitting">
              <span *ngIf="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ 'PROFILE.SAVE_CHANGES' | translate }}
            </button>
          </div>
        </ng-template>
      </form>
    </div>
  `,
  styles: [
    `
      label {
        color: var(--fm-text-muted);
      }
      .profile-form-card {
        background: transparent;
      }
      .personal-info-title {
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--fm-text-heading);
        letter-spacing: -0.02em;
      }
      .btn-edit-profile {
        border: 1px solid var(--fm-border-medium);
        background-color: var(--fm-color-neutral-100);
        color: var(--fm-color-primary-500);
        font-weight: 600;
        font-size: 0.82rem;
        transition: var(--fm-transition-smooth);
        box-shadow: var(--fm-shadow-xs);
      }
      .btn-edit-profile:hover {
        background-color: var(--fm-color-primary-500);
        border-color: var(--fm-color-primary-500);
        color: var(--fm-text-inverted);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px var(--fm-color-primary-glow);
      }
      .personal-info-list {
        gap: 12px;
      }
      .info-list-item {
        background: var(--fm-color-neutral-100);
        border: 1px solid var(--fm-border-medium) !important;
        border-radius: var(--fm-radius-md);
        transition: var(--fm-transition-smooth);
        cursor: pointer;
      }
      .info-list-item:hover {
        background: var(--fm-surface-card);
        border-color: var(--fm-color-primary-soft) !important;
        transform: translateY(-2px);
        box-shadow: var(--fm-shadow-md);
      }
      .info-icon-circle {
        width: 38px;
        height: 38px;
        background-color: var(--fm-color-neutral-200);
        color: var(--fm-text-muted);
        font-size: 1.1rem;
        flex-shrink: 0;
        border-radius: 50%;
        transition: var(--fm-transition-smooth);
      }
      .info-list-item:hover .info-icon-circle {
        background-color: var(--fm-color-primary-soft);
        color: var(--fm-color-primary-500);
        transform: scale(1.06);
      }
      .info-label-block {
        display: block;
        font-size: 0.72rem;
        color: var(--fm-text-muted);
        font-weight: 500;
        margin-bottom: 2px;
      }
      .info-value-block {
        display: block;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--fm-text-body);
      }
      .premium-input {
        border-radius: var(--fm-radius-lg);
        border: 1px solid var(--fm-input-border);
        background-color: var(--fm-input-bg);
        font-size: 0.95rem;
        height: 48px;
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
        font-size: 1.05rem;
      }
      .invalid-feedback {
        font-size: 0.8rem;
        color: var(--fm-color-danger-500);
        font-weight: 500;
      }
      .btn-save-profile {
        background-color: var(--fm-color-neutral-800);
        color: var(--fm-text-inverted);
        font-weight: 600;
        border-radius: var(--fm-radius-pill);
        transition: var(--fm-transition-button-hover);
        border: 1px solid var(--fm-color-neutral-800);
      }
      .btn-save-profile:hover:not(:disabled) {
        background-color: var(--fm-color-primary-500);
        border-color: var(--fm-color-primary-500);
        color: var(--fm-text-inverted);
        box-shadow: 0 4px 12px var(--fm-color-primary-glow);
        transform: translateY(-1px);
      }
      .btn-save-profile:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      .animate-item {
        animation: item-slide-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        animation-delay: calc(var(--i) * 0.08s);
      }
      @keyframes item-slide-in {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.98) translateY(6px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .disabled-email-input {
        background-color: var(--fm-color-neutral-200) !important;
        border-color: var(--fm-border-subtle) !important;
        color: var(--fm-text-disabled) !important;
        cursor: not-allowed !important;
      }
      .input-icon-right {
        z-index: 4;
        display: flex;
        align-items: center;
        font-size: 1.05rem;
      }
      .google-email-help {
        font-size: 0.78rem;
        font-weight: 500;
      }
      .google-email-help i {
        font-size: 0.9rem;
      }
      .premium-input {
        padding-inline-start: 3rem !important;
        padding-inline-end: 1rem !important;
      }
      .premium-input.pe-5 {
        padding-inline-end: 3rem !important;
      }
      .input-icon-left {
        inset-inline-start: 1rem !important;
        inset-inline-end: auto !important;
      }
      .input-icon-right {
        inset-inline-end: 1rem !important;
        inset-inline-start: auto !important;
      }
      .info-content-flex {
        margin-inline-start: 1rem !important;
      }
      .ms-auto {
        margin-inline-start: auto !important;
        margin-inline-end: 0 !important;
      }
    `
  ]
})
export class EditableProfileForm implements OnChanges {
  @Input() profile: IProfile | null = null;
  @Input() submitting = false;
  @Output() saveProfile = new EventEmitter<IUpdateProfileDto>();

  readonly isEditMode = signal(false);
  private formBuilder = new FormBuilder();

  readonly profileForm = this.formBuilder.group({
    fullName: ['', [Validators.required]],
    userName: ['', []],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', []],
    preferredLanguage: ['en', [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['profile'] && this.profile) {
      this.profileForm.patchValue({
        fullName: this.profile.fullName,
        userName: this.profile.userName ?? '',
        email: this.profile.email,
        phoneNumber: this.profile.phoneNumber ?? '',
        preferredLanguage: this.profile.preferredLanguage ?? 'en',
      });
      this.updateEmailEditability();
    }
  }

  updateEmailEditability(): void {
    const emailControl = this.profileForm.get('email');
    if (emailControl) {
      if (this.profile?.canEditEmail === false) {
        emailControl.disable();
      } else {
        emailControl.enable();
      }
    }
  }

  get formattedAddress(): string {
    if (!this.profile || !this.profile.addresses || this.profile.addresses.length === 0) {
      return 'N/A';
    }
    const address = this.profile.addresses[0];
    const cityCountry = [address.city, address.country].filter(Boolean).join(', ');
    return cityCountry ? cityCountry : (address.addressLine1 || '');
  }

  get fullName() {
    return this.profileForm.get('fullName')!;
  }

  get email() {
    return this.profileForm.get('email')!;
  }

  toggleEditMode(): void {
    this.isEditMode.update((value) => !value);
    if (!this.isEditMode()) {
      this.profileForm.markAsPristine();
      this.profileForm.markAsUntouched();
      if (this.profile) {
        this.profileForm.patchValue({
          fullName: this.profile.fullName,
          userName: this.profile.userName ?? '',
          email: this.profile.email,
          phoneNumber: this.profile.phoneNumber ?? '',
          preferredLanguage: this.profile.preferredLanguage ?? 'en',
        });
      }
    }
    this.updateEmailEditability();
  }

  onSubmit(): void {
    if (!this.isEditMode() || this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload: IUpdateProfileDto = {
      fullName: this.fullName.value as string,
      userName: this.profileForm.get('userName')?.value || null,
      email: this.email.value as string | null,
      phoneNumber: this.profileForm.get('phoneNumber')?.value || null,
      preferredLanguage: this.profileForm.get('preferredLanguage')?.value as 'en' | 'ar',
      profileImage: this.profile?.profileImage ?? null,
      addresses: this.profile?.addresses ?? [],
    };

    this.saveProfile.emit(payload);
    this.isEditMode.set(false); // return to read-only mode after submitting
  }
}
