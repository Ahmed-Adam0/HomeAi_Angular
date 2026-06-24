import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { strongPasswordValidator, passwordMatchValidator } from '../../../../shared/validators';
import { IChangePasswordDto } from '../../interfaces/ichange-password.dto';
import { ProfileService } from '../../services/profile.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective, AutoDirectionDirective],
  template: `
    <div appRtl class="change-password-card card border-0 overflow-hidden animate-card-entrance">
      <div class="card-body p-4 p-md-5">
        <div class="d-flex align-items-center gap-3 mb-4">
          <div class="icon-header-wrap">
            <i class="bi bi-shield-lock-fill text-gold fs-4"></i>
          </div>
          <div>
            <h3 class="h5 mb-0 font-bold text-dark tracking-tight">{{ 'PROFILE.CHANGE_PASSWORD' | translate }}</h3>
            <p class="text-muted small mb-0">{{ 'PROFILE.PRIVACY_SECURITY_DESC' | translate }}</p>
          </div>
        </div>

        <form [formGroup]="passwordForm" (ngSubmit)="submit()" class="row g-4">
          <!-- Current Password -->
          <div class="col-12 col-md-4">
            <label class="form-label font-semibold text-dark small mb-2" for="oldPassword">
              {{ 'PROFILE.CURRENT_PASSWORD' | translate }}
            </label>
            <div class="input-container position-relative">
              <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                <i class="bi bi-shield-lock"></i>
              </span>
              <input
                id="oldPassword"
                [type]="showCurrentPassword() ? 'text' : 'password'"
                class="form-control premium-input ps-5 pe-5"
                [class.is-invalid]="oldPassword.invalid && oldPassword.touched"
                formControlName="oldPassword"
                appAutoDir />
              <button
                type="button"
                class="btn-toggle-visibility position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent text-muted"
                (click)="showCurrentPassword.set(!showCurrentPassword())">
                <i class="bi" [class.bi-eye]="showCurrentPassword()" [class.bi-eye-slash]="!showCurrentPassword()"></i>
              </button>
            </div>
            <div class="invalid-feedback d-block mt-1 animate-fade-in" *ngIf="oldPassword.invalid && oldPassword.touched">
              {{ 'PROFILE.CURRENT_PASSWORD_REQUIRED' | translate }}
            </div>
          </div>

          <!-- New Password -->
          <div class="col-12 col-md-4">
            <label class="form-label font-semibold text-dark small mb-2" for="newPassword">
              {{ 'PROFILE.NEW_PASSWORD' | translate }}
            </label>
            <div class="input-container position-relative">
              <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                <i class="bi bi-key"></i>
              </span>
              <input
                id="newPassword"
                [type]="showNewPassword() ? 'text' : 'password'"
                class="form-control premium-input ps-5 pe-5"
                [class.is-invalid]="newPassword.invalid && newPassword.touched"
                formControlName="newPassword"
                appAutoDir />
              <button
                type="button"
                class="btn-toggle-visibility position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent text-muted"
                (click)="showNewPassword.set(!showNewPassword())">
                <i class="bi" [class.bi-eye]="showNewPassword()" [class.bi-eye-slash]="!showNewPassword()"></i>
              </button>
            </div>
            <div class="invalid-feedback d-block mt-1 animate-fade-in" *ngIf="newPassword.invalid && newPassword.touched">
              <ng-container *ngIf="newPassword.hasError('required')">
                {{ 'PROFILE.NEW_PASSWORD_REQUIRED' | translate }}
              </ng-container>
              <ng-container *ngIf="newPassword.hasError('strongPassword')">
                {{ 'PROFILE.PASSWORD_STRENGTH_ERROR' | translate }}
              </ng-container>
            </div>

            <!-- Password Strength Indicator -->
            <div class="password-strength-wrapper mt-3 animate-fade-in" *ngIf="newPasswordValue()">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="strength-label-text small font-semibold text-muted">Password Strength</span>
                <span class="strength-status-text small font-bold" [ngClass]="strengthColorClass()">
                  {{ strengthLabel() | translate }}
                </span>
              </div>
              <div class="strength-progress-bg">
                <div class="strength-progress-bar"
                     [ngClass]="strengthColorClass()"
                     [style.width.%]="strengthPercentage()">
                </div>
              </div>

              <!-- Rules checklist -->
              <ul class="strength-rules list-unstyled mt-3 d-flex flex-column gap-2">
                <li class="rule-item d-flex align-items-center gap-2 small" [class.satisfied]="hasMinLength()">
                  <i class="bi" [class.bi-check-circle-fill]="hasMinLength()" [class.bi-circle]="!hasMinLength()"></i>
                  <span>{{ 'PROFILE.PASSWORD_RULE_MIN_CHAR' | translate }}</span>
                </li>
                <li class="rule-item d-flex align-items-center gap-2 small" [class.satisfied]="hasUpperCase()">
                  <i class="bi" [class.bi-check-circle-fill]="hasUpperCase()" [class.bi-circle]="!hasUpperCase()"></i>
                  <span>{{ 'PROFILE.PASSWORD_RULE_UPPERCASE' | translate }}</span>
                </li>
                <li class="rule-item d-flex align-items-center gap-2 small" [class.satisfied]="hasLowerCase()">
                  <i class="bi" [class.bi-check-circle-fill]="hasLowerCase()" [class.bi-circle]="!hasLowerCase()"></i>
                  <span>{{ 'PROFILE.PASSWORD_RULE_LOWERCASE' | translate }}</span>
                </li>
                <li class="rule-item d-flex align-items-center gap-2 small" [class.satisfied]="hasNumeric()">
                  <i class="bi" [class.bi-check-circle-fill]="hasNumeric()" [class.bi-circle]="!hasNumeric()"></i>
                  <span>{{ 'PROFILE.PASSWORD_RULE_NUMBER' | translate }}</span>
                </li>
                <li class="rule-item d-flex align-items-center gap-2 small" [class.satisfied]="hasSpecialChar()">
                  <i class="bi" [class.bi-check-circle-fill]="hasSpecialChar()" [class.bi-circle]="!hasSpecialChar()"></i>
                  <span>{{ 'PROFILE.PASSWORD_RULE_SPECIAL' | translate }}</span>
                </li>
              </ul>
            </div>
          </div>

          <!-- Confirm New Password -->
          <div class="col-12 col-md-4">
            <label class="form-label font-semibold text-dark small mb-2" for="confirmNewPassword">
              {{ 'PROFILE.CONFIRM_PASSWORD' | translate }}
            </label>
            <div class="input-container position-relative">
              <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                <i class="bi bi-key-fill"></i>
              </span>
              <input
                id="confirmNewPassword"
                [type]="showConfirmNewPassword() ? 'text' : 'password'"
                class="form-control premium-input ps-5 pe-5"
                [class.is-invalid]="(confirmNewPassword.invalid && confirmNewPassword.touched) || passwordForm.hasError('passwordMismatch')"
                formControlName="confirmNewPassword"
                appAutoDir />
              <button
                type="button"
                class="btn-toggle-visibility position-absolute top-50 end-0 translate-middle-y me-3 border-0 bg-transparent text-muted"
                (click)="showConfirmNewPassword.set(!showConfirmNewPassword())">
                <i class="bi" [class.bi-eye]="showConfirmNewPassword()" [class.bi-eye-slash]="!showConfirmNewPassword()"></i>
              </button>
            </div>
            <div class="invalid-feedback d-block mt-1 animate-fade-in" *ngIf="(confirmNewPassword.invalid && confirmNewPassword.touched) || passwordForm.hasError('passwordMismatch')">
              <ng-container *ngIf="confirmNewPassword.hasError('required')">
                {{ 'PROFILE.CONFIRM_PASSWORD_REQUIRED' | translate }}
              </ng-container>
              <ng-container *ngIf="passwordForm.hasError('passwordMismatch')">
                {{ 'PROFILE.PASSWORD_MATCH_ERROR' | translate }}
              </ng-container>
            </div>
          </div>

          <!-- Submit Button -->
          <div class="col-12 d-flex justify-content-end mt-4 pt-2">
            <button type="submit" class="btn btn-change-pw btn-md btn-rounded px-4" [disabled]="submitting()">
              <span *ngIf="submitting()" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              <i *ngIf="!submitting() && showSuccessCheck()" class="bi bi-check2-all me-2 animate-scale-up text-success"></i>
              {{ 'PROFILE.CHANGE_PASSWORD' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .icon-header-wrap {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        background: rgba(184, 147, 92, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .text-gold {
        color: var(--fm-color-primary-500) !important;
      }
      .change-password-card {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.6) 100%);
        backdrop-filter: var(--fm-glass-blur);
        -webkit-backdrop-filter: var(--fm-glass-blur);
        border: 1px solid var(--fm-glass-border) !important;
        box-shadow: var(--fm-shadow-lg) !important;
        border-radius: var(--fm-radius-xl) !important;
        transition: var(--fm-transition-smooth);
      }
      .change-password-card:hover {
        box-shadow: 0 30px 60px rgba(184, 147, 92, 0.05) !important;
        border-color: rgba(184, 147, 92, 0.2) !important;
      }
      .premium-input {
        border-radius: var(--fm-radius-lg);
        border: 1px solid var(--fm-color-neutral-200);
        background-color: rgba(255, 255, 255, 0.8);
        font-size: 0.95rem;
        height: 48px;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
      .btn-toggle-visibility {
        z-index: 4;
        transition: color 0.2s ease, transform 0.2s ease;
        padding: 4px;
        color: var(--fm-color-neutral-400);
      }
      .btn-toggle-visibility:hover {
        color: var(--fm-color-primary-500) !important;
        transform: scale(1.1);
      }
      .btn-toggle-visibility:active {
        transform: scale(0.95);
      }
      .invalid-feedback {
        font-size: 0.82rem;
        color: #dc3545;
        font-weight: 500;
      }
      .btn-change-pw {
        background-color: var(--fm-color-neutral-900);
        color: #ffffff;
        font-weight: 600;
        border-radius: var(--fm-radius-pill);
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        border: 1px solid var(--fm-color-neutral-900);
        position: relative;
        overflow: hidden;
      }
      .btn-change-pw:hover:not(:disabled) {
        background-color: var(--fm-color-primary-500);
        border-color: var(--fm-color-primary-500);
        color: #ffffff;
        box-shadow: 0 8px 20px rgba(184, 147, 92, 0.25);
        transform: translateY(-2px);
      }
      .btn-change-pw:active:not(:disabled) {
        transform: translateY(0) scale(0.98);
      }
      .btn-change-pw:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      /* Strength Progress styling */
      .strength-progress-bg {
        height: 6px;
        background-color: var(--fm-color-neutral-200);
        border-radius: 3px;
        overflow: hidden;
        margin-top: 4px;
      }
      .strength-progress-bar {
        height: 100%;
        width: 0;
        border-radius: 3px;
        transition: width 0.4s ease, background-color 0.4s ease;
      }
      .strength-weak {
        background-color: #dc3545 !important;
        color: #dc3545 !important;
      }
      .strength-fair {
        background-color: #fd7e14 !important;
        color: #fd7e14 !important;
      }
      .strength-good {
        background-color: #0dcaf0 !important;
        color: #0dcaf0 !important;
      }
      .strength-strong {
        background-color: #198754 !important;
        color: #198754 !important;
      }
      .strength-rules {
        border-top: 1px dashed var(--fm-glass-border);
        padding-top: 12px;
      }
      .rule-item {
        color: var(--fm-color-neutral-500);
        transition: color 0.3s ease;
      }
      .rule-item i {
        font-size: 0.9rem;
        transition: transform 0.3s ease, color 0.3s ease;
        color: var(--fm-color-neutral-400);
      }
      .rule-item.satisfied {
        color: #198754;
      }
      .rule-item.satisfied i {
        color: #198754;
        transform: scale(1.1);
      }
      /* Animations */
      .animate-card-entrance {
        animation: card-slide-up 0.65s cubic-bezier(0.16, 1, 0.3, 1) both;
      }
      @keyframes card-slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in {
        animation: fade-in 0.3s ease both;
      }
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-scale-up {
        animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      @keyframes scale-up {
        from { transform: scale(0.5); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .premium-input {
        padding-inline-start: 3rem !important;
        padding-inline-end: 3rem !important;
      }
      .input-icon-left {
        inset-inline-start: 1rem !important;
        inset-inline-end: auto !important;
      }
      .btn-toggle-visibility {
        inset-inline-end: 1rem !important;
        inset-inline-start: auto !important;
      }
    `
  ]
})
export class ChangePasswordForm {
  private readonly profileService = inject(ProfileService);
  private readonly uiState = inject(UiState);
  private readonly translationService = inject(TranslationService);
  private readonly formBuilder = new FormBuilder();

  readonly submitting = signal(false);
  readonly showSuccessCheck = signal(false);

  // Visibility states
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmNewPassword = signal(false);

  // Real-time password value tracker
  readonly newPasswordValue = signal('');

  readonly passwordForm = this.formBuilder.group(
    {
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, strongPasswordValidator()]],
      confirmNewPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordMatchValidator('newPassword', 'confirmNewPassword')],
    }
  );

  constructor() {
    this.newPassword.valueChanges.subscribe(val => {
      this.newPasswordValue.set(val || '');
    });
  }

  get oldPassword() {
    return this.passwordForm.get('oldPassword')!;
  }

  get newPassword() {
    return this.passwordForm.get('newPassword')!;
  }

  get confirmNewPassword() {
    return this.passwordForm.get('confirmNewPassword')!;
  }

  // Computed properties for strength indicator rules
  readonly hasMinLength = computed(() => this.newPasswordValue().length >= 8);
  readonly hasUpperCase = computed(() => /[A-Z]/.test(this.newPasswordValue()));
  readonly hasLowerCase = computed(() => /[a-z]/.test(this.newPasswordValue()));
  readonly hasNumeric = computed(() => /[0-9]/.test(this.newPasswordValue()));
  readonly hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(this.newPasswordValue()));

  readonly strengthScore = computed(() => {
    let score = 0;
    if (this.hasMinLength()) score++;
    if (this.hasUpperCase()) score++;
    if (this.hasLowerCase()) score++;
    if (this.hasNumeric()) score++;
    if (this.hasSpecialChar()) score++;
    return score;
  });

  readonly strengthPercentage = computed(() => this.strengthScore() * 20);

  readonly strengthLabel = computed(() => {
    const score = this.strengthScore();
    if (score === 0) return '';
    if (score <= 2) return 'PROFILE.PASSWORD_STRENGTH_WEAK';
    if (score === 3) return 'PROFILE.PASSWORD_STRENGTH_FAIR';
    if (score === 4) return 'PROFILE.PASSWORD_STRENGTH_GOOD';
    return 'PROFILE.PASSWORD_STRENGTH_STRONG';
  });

  readonly strengthColorClass = computed(() => {
    const score = this.strengthScore();
    if (score <= 2) return 'strength-weak';
    if (score === 3) return 'strength-fair';
    if (score === 4) return 'strength-good';
    return 'strength-strong';
  });

  submit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const payload: IChangePasswordDto = {
      oldPassword: this.oldPassword.value as string,
      newPassword: this.newPassword.value as string,
      confirmNewPassword: this.confirmNewPassword.value as string,
    };

    this.profileService.changePassword(payload).pipe(
      finalize(() => this.submitting.set(false))
    ).subscribe({
      next: () => {
        this.uiState.showAlert('success', this.translationService.translate('PROFILE.PASSWORD_UPDATED'));
        this.passwordForm.reset();
        this.newPasswordValue.set('');
        this.showSuccessCheck.set(true);
        setTimeout(() => this.showSuccessCheck.set(false), 3000);
      },
      error: () => {
        this.uiState.showAlert('danger', this.translationService.translate('PROFILE.PASSWORD_UPDATE_ERROR'));
      }
    });
  }
}

