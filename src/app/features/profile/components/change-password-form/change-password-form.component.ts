import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { strongPasswordValidator, passwordMatchValidator } from '../../../../shared/validators';
import { IChangePasswordDto } from '../../interfaces/ichange-password.dto';
import { ProfileService } from '../../services/profile.service';
import { UiState } from '../../../../core/state/ui.state';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-change-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, RtlDirective],
  template: `
    <div appRtl class="change-password-card card border-0 shadow-sm rounded-4 bg-white">
      <div class="card-body p-4">
        <h3 class="h5 mb-3">{{ 'PROFILE.CHANGE_PASSWORD' | translate }}</h3>
        <form [formGroup]="passwordForm" (ngSubmit)="submit()" class="row g-3">
          <div class="col-12 col-md-4">
            <label class="form-label" for="oldPassword">{{ 'PROFILE.OLD_PASSWORD' | translate }}</label>
            <input id="oldPassword" type="password" class="form-control" formControlName="oldPassword" />
            <div class="invalid-feedback d-block" *ngIf="oldPassword.invalid && oldPassword.touched">
              {{ 'PROFILE.OLD_PASSWORD_REQUIRED' | translate }}
            </div>
          </div>

          <div class="col-12 col-md-4">
            <label class="form-label" for="newPassword">{{ 'PROFILE.NEW_PASSWORD' | translate }}</label>
            <input id="newPassword" type="password" class="form-control" formControlName="newPassword" />
            <div class="invalid-feedback d-block" *ngIf="newPassword.invalid && newPassword.touched">
              <ng-container *ngIf="newPassword.hasError('required')">
                {{ 'PROFILE.NEW_PASSWORD_REQUIRED' | translate }}
              </ng-container>
              <ng-container *ngIf="newPassword.hasError('strongPassword')">
                {{ 'PROFILE.PASSWORD_STRENGTH_ERROR' | translate }}
              </ng-container>
            </div>
          </div>

          <div class="col-12 col-md-4">
            <label class="form-label" for="confirmNewPassword">{{ 'PROFILE.CONFIRM_PASSWORD' | translate }}</label>
            <input id="confirmNewPassword" type="password" class="form-control" formControlName="confirmNewPassword" />
            <div class="invalid-feedback d-block" *ngIf="(confirmNewPassword.invalid && confirmNewPassword.touched) || passwordForm.hasError('passwordMismatch')">
              <ng-container *ngIf="confirmNewPassword.hasError('required')">
                {{ 'PROFILE.CONFIRM_PASSWORD_REQUIRED' | translate }}
              </ng-container>
              <ng-container *ngIf="passwordForm.hasError('passwordMismatch')">
                {{ 'PROFILE.PASSWORD_MATCH_ERROR' | translate }}
              </ng-container>
            </div>
          </div>

          <div class="col-12 text-end">
            <button type="submit" class="btn btn-primary rounded-pill px-4" [disabled]="submitting()">
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
        min-height: 100%;
      }
      .invalid-feedback {
        font-size: 0.85rem;
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
