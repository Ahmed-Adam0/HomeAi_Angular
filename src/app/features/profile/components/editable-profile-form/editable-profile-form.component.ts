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
              <h3 class="h5 mb-1 font-semibold text-dark">{{ 'PROFILE.PERSONAL_INFORMATION' | translate }}</h3>
              <p class="text-muted small mb-0">{{ 'PROFILE.AI_ACTIVITY' | translate }}</p>
            </div>
            <!-- Edit/Cancel Button -->
            <button type="button" class="btn btn-sm btn-outline d-flex align-items-center gap-2 rounded-pill px-3" (click)="toggleEditMode()">
              <i class="bi" [class.bi-pencil]="!isEditMode()" [class.bi-x-lg]="isEditMode()"></i>
              {{ isEditMode() ? ('PROFILE.CANCEL' | translate) : ('PROFILE.EDIT' | translate) }}
            </button>
          </div>

          <!-- Fields Grid -->
          <div class="row g-4">
            <!-- Full Name -->
            <div class="col-12 col-md-6">
              <label class="form-label font-medium text-dark small mb-2" for="fullName">{{ 'PROFILE.FULL_NAME' | translate }}</label>
              <div class="input-container position-relative" [class.readonly]="!isEditMode()">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-person"></i>
                </span>
                <input
                  id="fullName"
                  class="form-control premium-input ps-5"
                  [class.is-invalid]="fullName.invalid && fullName.touched"
                  type="text"
                  formControlName="fullName"
                  [readonly]="!isEditMode()"
                  appAutoDir />
              </div>
              <div class="invalid-feedback d-block mt-1" *ngIf="fullName.invalid && fullName.touched">
                {{ 'PROFILE.FULL_NAME' | translate }} is required.
              </div>
            </div>

            <!-- Email -->
            <div class="col-12 col-md-6">
              <label class="form-label font-medium text-dark small mb-2" for="email">{{ 'PROFILE.EMAIL' | translate }}</label>
              <div class="input-container position-relative" [class.readonly]="!isEditMode()">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-envelope"></i>
                </span>
                <input
                  id="email"
                  class="form-control premium-input ps-5"
                  [class.is-invalid]="email.invalid && email.touched"
                  type="email"
                  formControlName="email"
                  [readonly]="!isEditMode()"
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
              <label class="form-label font-medium text-dark small mb-2" for="phoneNumber">{{ 'PROFILE.PHONE' | translate }}</label>
              <div class="input-container position-relative" [class.readonly]="!isEditMode()">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-telephone"></i>
                </span>
                <input
                  id="phoneNumber"
                  class="form-control premium-input ps-5"
                  type="tel"
                  formControlName="phoneNumber"
                  [readonly]="!isEditMode()"
                  appAutoDir />
              </div>
            </div>

            <!-- Address (Informational) -->
            <div class="col-12 col-md-6">
              <label class="form-label font-medium text-dark small mb-2">{{ 'PROFILE.ADDRESS' | translate }}</label>
              <div class="input-container position-relative readonly">
                <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                  <i class="bi bi-geo-alt"></i>
                </span>
                <input
                  class="form-control premium-input ps-5 text-truncate"
                  type="text"
                  [value]="formattedAddress"
                  readonly
                  appAutoDir />
              </div>
              <div class="small text-muted mt-1" *ngIf="isEditMode()">
                * Address values can be managed in the Address section below.
              </div>
            </div>

            <!-- Preferred Language (Only visible/editable in Edit mode) -->
            <div class="col-12 col-md-6" *ngIf="isEditMode()">
              <label class="form-label font-medium text-dark small mb-2" for="preferredLanguage">{{ 'PROFILE.PREFERRED_LANGUAGE' | translate }}</label>
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
          <div class="mt-4 pt-2 d-flex justify-content-end gap-3" *ngIf="isEditMode()">
            <button type="submit" class="btn btn-dark btn-md btn-rounded btn-ripple-effect px-4" [disabled]="submitting">
              <span *ngIf="submitting" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ 'PROFILE.SAVE_CHANGES' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-form-card {
        background: var(--fm-glass-bg);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
      }
      .premium-input {
        border-radius: var(--fm-radius-lg);
        border: 1px solid var(--fm-input-border);
        background-color: var(--fm-input-bg);
        font-size: 0.95rem;
        height: 48px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        color: var(--fm-color-neutral-800);
      }
      .premium-input:focus {
        border-color: var(--fm-input-focus-border);
        box-shadow: 0 0 0 4px var(--fm-input-focus-ring);
        outline: none;
      }
      .input-container.readonly .premium-input {
        background-color: rgba(244, 242, 238, 0.3);
        border-color: transparent;
        color: var(--fm-color-neutral-700);
        cursor: default;
        pointer-events: none;
      }
      .input-icon-left {
        z-index: 4;
        display: flex;
        align-items: center;
      }
      .invalid-feedback {
        font-size: 0.85rem;
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
