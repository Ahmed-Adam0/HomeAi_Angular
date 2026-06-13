import { Component, inject, signal } from '@angular/core';
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
    <div appRtl class="change-password-card card border-0 overflow-hidden">
      <div class="card-body p-4 p-md-5">
        <h3 class="h5 mb-4 font-semibold text-dark">{{ 'PROFILE.CHANGE_PASSWORD' | translate }}</h3>
        <form [formGroup]="passwordForm" (ngSubmit)="submit()" class="row g-4">
          <!-- Old Password -->
          <div class="col-12 col-md-4">
            <label class="form-label font-medium text-dark small mb-2" for="oldPassword">{{ 'PROFILE.OLD_PASSWORD' | translate }}</label>
            <div class="input-container position-relative">
              <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                <i class="bi bi-shield-lock"></i>
              </span>
              <input
                id="oldPassword"
                type="password"
                class="form-control premium-input ps-5"
                [class.is-invalid]="oldPassword.invalid && oldPassword.touched"
                formControlName="oldPassword"
                appAutoDir />
            </div>
            <div class="invalid-feedback d-block mt-1" *ngIf="oldPassword.invalid && oldPassword.touched">
              {{ 'PROFILE.OLD_PASSWORD_REQUIRED' | translate }}
            </div>
          </div>

          <!-- New Password -->
          <div class="col-12 col-md-4">
            <label class="form-label font-medium text-dark small mb-2" for="newPassword">{{ 'PROFILE.NEW_PASSWORD' | translate }}</label>
            <div class="input-container position-relative">
              <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                <i class="bi bi-key"></i>
              </span>
              <input
                id="newPassword"
                type="password"
                class="form-control premium-input ps-5"
                [class.is-invalid]="newPassword.invalid && newPassword.touched"
                formControlName="newPassword"
                appAutoDir />
            </div>
            <div class="invalid-feedback d-block mt-1" *ngIf="newPassword.invalid && newPassword.touched">
              <ng-container *ngIf="newPassword.hasError('required')">
                {{ 'PROFILE.NEW_PASSWORD_REQUIRED' | translate }}
              </ng-container>
              <ng-container *ngIf="newPassword.hasError('strongPassword')">
                {{ 'PROFILE.PASSWORD_STRENGTH_ERROR' | translate }}
              </ng-container>
            </div>
          </div>

          <!-- Confirm New Password -->
          <div class="col-12 col-md-4">
            <label class="form-label font-medium text-dark small mb-2" for="confirmNewPassword">{{ 'PROFILE.CONFIRM_PASSWORD' | translate }}</label>
            <div class="input-container position-relative">
              <span class="input-icon-left position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
                <i class="bi bi-key-fill"></i>
              </span>
              <input
                id="confirmNewPassword"
                type="password"
                class="form-control premium-input ps-5"
                [class.is-invalid]="(confirmNewPassword.invalid && confirmNewPassword.touched) || passwordForm.hasError('passwordMismatch')"
                formControlName="confirmNewPassword"
                appAutoDir />
            </div>
            <div class="invalid-feedback d-block mt-1" *ngIf="(confirmNewPassword.invalid && confirmNewPassword.touched) || passwordForm.hasError('passwordMismatch')">
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
            <button type="submit" class="btn btn-dark btn-md btn-rounded btn-ripple-effect px-4" [disabled]="submitting()">
              <span *ngIf="submitting()" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              {{ 'PROFILE.CHANGE_PASSWORD' | translate }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .change-password-card {
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
export class ChangePasswordForm {
  private readonly profileService = inject(ProfileService);
  private readonly uiState = inject(UiState);
  private readonly translationService = inject(TranslationService);
  private readonly formBuilder = new FormBuilder();

  readonly submitting = signal(false);

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

  get oldPassword() {
    return this.passwordForm.get('oldPassword')!;
  }

  get newPassword() {
    return this.passwordForm.get('newPassword')!;
  }

  get confirmNewPassword() {
    return this.passwordForm.get('confirmNewPassword')!;
  }

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
      },
      error: () => {
        this.uiState.showAlert('danger', this.translationService.translate('PROFILE.PASSWORD_UPDATE_ERROR'));
      }
    });
  }
}
