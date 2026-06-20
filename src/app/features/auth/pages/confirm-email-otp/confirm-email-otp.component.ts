import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthErrorHandler } from '../../services/auth-error-handler.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-confirm-email-otp',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AutoDirectionDirective,
    TranslatePipe
  ],
  templateUrl: './confirm-email-otp.component.html',
  styleUrls: ['../login/login.component.css']
})
export class ConfirmEmailOtp {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authErrorHandler = inject(AuthErrorHandler);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private uiState = inject(UiState);

  confirmForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  private accountType: 'customer' | 'vendor' = 'customer';

  readonly navRoutes = NAV_ROUTES;
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const accountTypeParam = this.route.snapshot.queryParamMap.get('accountType') as 'customer' | 'vendor' | null;

    this.accountType = accountTypeParam ?? 'customer';

    this.confirmForm = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      otpCodeEmail: ['', [Validators.required, Validators.pattern(/^\d+$/), Validators.minLength(4)]],
    });
  }

  showValidation(controlName: string): boolean {
    const control = this.confirmForm.get(controlName);
    return !!(control && control.touched && control.invalid);
  }

  showSuccess(controlName: string): boolean {
    const control = this.confirmForm.get(controlName);
    return !!(control && control.touched && control.valid && control.value);
  }

  onSubmit(): void {
    if (this.confirmForm.invalid) {
      this.confirmForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      ...this.confirmForm.value,
      accountType: this.accountType
    };

    this.authService.confirmEmailOtp(payload).subscribe({
      next: () => {
        this.isLoading = false;
        const localizedSuccess = this.translationService.translate('CONFIRM_EMAIL_OTP.SUCCESS_MESSAGE');
        this.uiState.showAlert('success', localizedSuccess);
        
        // Navigate to appropriate login page based on account type
        const loginRoute = this.accountType === 'vendor' ? NAV_ROUTES.VENDOR_LOGIN : NAV_ROUTES.LOGIN;
        this.router.navigate([loginRoute]);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.authErrorHandler.handle(err);
        this.uiState.showAlert('danger', this.errorMessage);
      }
    });
  }
}
