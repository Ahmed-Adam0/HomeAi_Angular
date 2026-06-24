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
    <div appRtl class="profile-form-card card border-0 overflow-hidden">
      <div class="card-body p-4 p-md-5">
        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
          <!-- Header -->
          <div class="d-flex align-items-center justify-content-between mb-4 pb-2">
            <div>
              <h3 class="h5 mb-1 font-bold text-dark tracking-tight">{{ 'PROFILE.PERSONAL_INFORMATION' | translate }}</h3>
              <p class="text-muted small mb-0">{{ 'PROFILE.AI_ACTIVITY' | translate }}</p>
            </div>
            <!-- Edit/Cancel Button -->
            <button type="button" class="btn btn-sm btn-outline-edit d-flex align-items-center gap-2 rounded-pill px-3" (click)="toggleEditMode()">
              <i class="bi" [class.bi-pencil-fill]="!isEditMode()" [class.bi-x-lg]="isEditMode()"></i>
              {{ isEditMode() ? ('PROFILE.CANCEL' | translate) : ('PROFILE.EDIT' | translate) }}
            </button>
          </div>

          <!-- Read-only View: Premium Info Cards -->
          <ng-container *ngIf="!isEditMode(); else editFields">
            <div class="row g-3">
              <!-- Full Name -->
              <div class="col-12 col-md-6">
                <div class="info-card p-3.5 rounded-4 d-flex align-items-center gap-3">
                  <div class="info-icon-box d-flex align-items-center justify-content-center rounded-3">
                    <i class="bi bi-person-fill"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="info-label text-muted text-uppercase">{{ 'PROFILE.FULL_NAME' | translate }}</div>
                    <div class="info-value text-dark font-semibold">{{ profile?.fullName || 'N/A' }}</div>
                  </div>
                </div>
              </div>
              <!-- Email -->
              <div class="col-12 col-md-6">
                <div class="info-card p-3.5 rounded-4 d-flex align-items-center gap-3">
                  <div class="info-icon-box d-flex align-items-center justify-content-center rounded-3">
                    <i class="bi bi-envelope-fill"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="info-label text-muted text-uppercase">{{ 'PROFILE.EMAIL' | translate }}</div>
                    <div class="info-value text-dark font-semibold text-truncate" style="max-width: 250px;">{{ profile?.email || 'N/A' }}</div>
                  </div>
                </div>
              </div>
              <!-- Phone -->
              <div class="col-12 col-md-6">
                <div class="info-card p-3.5 rounded-4 d-flex align-items-center gap-3">
                  <div class="info-icon-box d-flex align-items-center justify-content-center rounded-3">
                    <i class="bi bi-telephone-fill"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="info-label text-muted text-uppercase">{{ 'PROFILE.PHONE' | translate }}</div>
                    <div class="info-value text-dark font-semibold">{{ profile?.phoneNumber || 'N/A' }}</div>
                  </div>
                </div>
              </div>
              <!-- Language -->
              <div class="col-12 col-md-6">
                <div class="info-card p-3.5 rounded-4 d-flex align-items-center gap-3">
                  <div class="info-icon-box d-flex align-items-center justify-content-center rounded-3">
                    <i class="bi bi-translate"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="info-label text-muted text-uppercase">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</div>
                    <div class="info-value text-dark font-semibold">
                      {{ profile?.preferredLanguage === 'ar' ? ('PROFILE.LANG_ARABIC' | translate) : ('PROFILE.LANG_ENGLISH' | translate) }}
                    </div>
                  </div>
                </div>
              </div>
              <!-- Default Address -->
              <div class="col-12">
                <div class="info-card p-3.5 rounded-4 d-flex align-items-center gap-3">
                  <div class="info-icon-box d-flex align-items-center justify-content-center rounded-3">
                    <i class="bi bi-geo-alt-fill"></i>
                  </div>
                  <div class="flex-grow-1">
                    <div class="info-label text-muted text-uppercase">{{ 'PROFILE.ADDRESS' | translate }}</div>
                    <div class="info-value text-dark font-semibold">{{ formattedAddress }}</div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- Edit View: Fields Grid -->
          <ng-template #editFields>
            <div class="row g-4">
              <!-- Full Name -->
              <div class="col-12 col-md-6">
                <label class="form-label font-semibold text-dark small mb-2" for="fullName">{{ 'PROFILE.FULL_NAME' | translate }}</label>
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
                <label class="form-label font-semibold text-dark small mb-2" for="email">{{ 'PROFILE.EMAIL' | translate }}</label>
                <div class="input-container position-relative">
                  <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                    <i class="bi bi-envelope"></i>
                  </span>
                  <input
                    id="email"
                    class="form-control premium-input ps-5"
                    [class.is-invalid]="email.invalid && email.touched"
                    type="email"
                    formControlName="email"
                    appAutoDir />
                </div>
                <div class="invalid-feedback d-block mt-1" *ngIf="email.invalid && email.touched">
                  <ng-container *ngIf="email.hasError('required')">
                    {{ 'PROFILE.EMAIL_REQUIRED' | translate }}
                  </ng-container>
                  <ng-container *ngIf="email.hasError('email')">
                    {{ 'PROFILE.EMAIL_INVALID' | translate }}
                  </ng-container>
                </div>
              </div>

              <!-- Phone -->
              <div class="col-12 col-md-6">
                <label class="form-label font-semibold text-dark small mb-2" for="phoneNumber">{{ 'PROFILE.PHONE' | translate }}</label>
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
                <label class="form-label font-semibold text-dark small mb-2" for="preferredLanguage">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</label>
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
              <button type="submit" class="btn btn-save-profile btn-md btn-rounded px-4" [disabled]="submitting">
                <span *ngIf="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ 'PROFILE.SAVE_CHANGES' | translate }}
              </button>
            </div>
          </ng-template>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-form-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.6) 100%);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
        transition: var(--fm-transition-smooth);
      }
      .profile-form-card:hover {
        box-shadow: 0 30px 60px rgba(184, 147, 92, 0.05) !important;
        border-color: rgba(184, 147, 92, 0.2) !important;
      }
      .btn-outline-edit {
        border: 1px solid var(--fm-color-neutral-300);
        background-color: transparent;
        color: var(--fm-color-neutral-700);
        font-weight: 600;
        font-size: 0.85rem;
        transition: var(--fm-transition-smooth);
      }
      .btn-outline-edit:hover {
        background-color: var(--fm-color-neutral-900);
        border-color: var(--fm-color-neutral-900);
        color: #ffffff;
        box-shadow: var(--fm-shadow-md);
      }
      .info-card {
        background-color: rgba(255, 255, 255, 0.5);
        border: 1px solid rgba(184, 147, 92, 0.06);
        transition: var(--fm-transition-smooth);
      }
      .info-card:hover {
        transform: translateY(-2px);
        background-color: #ffffff;
        border-color: rgba(184, 147, 92, 0.15);
        box-shadow: var(--fm-shadow-md);
      }
      .info-icon-box {
        width: 44px;
        height: 44px;
        background-color: rgba(184, 147, 92, 0.08);
        color: var(--fm-color-primary-500);
        font-size: 1.2rem;
        flex-shrink: 0;
        transition: var(--fm-transition-smooth);
      }
      .info-card:hover .info-icon-box {
        background-color: var(--fm-color-primary-500);
        color: #ffffff;
        transform: scale(1.05);
      }
      .info-label {
        font-size: 0.65rem;
        letter-spacing: 0.06em;
        font-weight: 700;
        margin-bottom: 2px;
      }
      .info-value {
        font-size: 0.95rem;
        color: var(--fm-color-neutral-800);
      }
      .premium-input {
        border-radius: var(--fm-radius-lg);
        border: 1px solid var(--fm-color-neutral-200);
        background-color: rgba(255, 255, 255, 0.8);
        font-size: 0.95rem;
        height: 48px;
        transition: var(--fm-transition-smooth);
        color: var(--fm-color-neutral-800);
      }
      .premium-input:focus {
        border-color: var(--fm-color-primary-500);
        background-color: #ffffff;
        box-shadow: 0 0 0 4px rgba(184, 147, 92, 0.1);
        outline: none;
      }
      .input-icon-left {
        z-index: 4;
        display: flex;
        align-items: center;
        font-size: 1.1rem;
      }
      .invalid-feedback {
        font-size: 0.82rem;
        color: #dc3545;
        font-weight: 500;
      }
      .btn-save-profile {
        background-color: var(--fm-color-neutral-900);
        color: #ffffff;
        font-weight: 600;
        border-radius: var(--fm-radius-pill);
        transition: var(--fm-transition-smooth);
        border: 1px solid var(--fm-color-neutral-900);
      }
      .btn-save-profile:hover {
        background-color: var(--fm-color-primary-500);
        border-color: var(--fm-color-primary-500);
        color: #ffffff;
        box-shadow: 0 8px 20px rgba(184, 147, 92, 0.25);
        transform: translateY(-2px);
      }
      .btn-save-profile:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
    }
  }

  get formattedAddress(): string {
    if (!this.profile || !this.profile.addresses || this.profile.addresses.length === 0) {
      return 'No address added';
    }
    const address = this.profile.addresses[0];
    const lines = [address.addressLine1, address.addressLine2, address.city, address.country].filter(Boolean);
    return lines.join(', ');
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
