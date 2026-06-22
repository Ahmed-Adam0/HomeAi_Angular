import { Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthErrorHandler } from '../../services/auth-error-handler.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AutoDirectionDirective],
  templateUrl: './reset-password.component.html',
  styleUrls: ['../login/login.component.css']
})
export class ResetPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authErrorHandler = inject(AuthErrorHandler);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  email = '';
  otp = '';

  resetForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  readonly navRoutes = NAV_ROUTES;
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'إعادة تعيين كلمة المرور',
      pageSubtitle: 'أدخل كلمة مرور جديدة لحسابك.',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'صيغة البريد غير صحيحة.',
      otpLabel: 'رمز التحقق',
      otpPlaceholder: 'أدخل رمز OTP',
      otpRequired: 'رمز التحقق مطلوب.',
      newPasswordLabel: 'كلمة المرور الجديدة',
      newPasswordPlaceholder: 'أدخل كلمة المرور الجديدة',
      newPasswordRequired: 'كلمة المرور الجديدة مطلوبة.',
      confirmPasswordLabel: 'تأكيد كلمة المرور الجديدة',
      passwordsMismatch: 'كلمتا المرور غير متطابقتين.',
      submitButton: 'إعادة التعيين',
      loginLink: 'تسجيل الدخول',
      visualHeading: 'أعد تعيين كلمة المرور بأمان',
      visualSubtitle: 'اختر كلمة مرور جديدة لحسابك وحافظ على بياناتك آمنة.',
      successMessage: 'تم إعادة تعيين كلمة المرور بنجاح. الرجاء تسجيل الدخول.'
    },
    en: {
      pageTitle: 'Reset Password',
      pageSubtitle: 'Enter a new password for your account.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      otpLabel: 'Verification Code',
      otpPlaceholder: 'Enter your OTP code',
      otpRequired: 'OTP code is required.',
      newPasswordLabel: 'New Password',
      newPasswordPlaceholder: 'Enter your new password',
      newPasswordRequired: 'New password is required.',
      confirmPasswordLabel: 'Confirm New Password',
      passwordsMismatch: 'Passwords do not match.',
      submitButton: 'Reset Password',
      loginLink: 'Sign In',
      visualHeading: 'Reset your password securely',
      visualSubtitle: 'Choose a new password for your account and keep your data secure.',
      successMessage: 'Password reset successfully. Please sign in.'
    }
  } as const;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.email = sessionStorage.getItem('passwordResetEmail') ?? '';
      this.otp = sessionStorage.getItem('passwordResetOtp') ?? '';
    }

    if (!this.email || !this.otp) {
      this.router.navigate([NAV_ROUTES.FORGOT_PASSWORD]);
    }

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  onSubmit(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (isPlatformBrowser(this.platformId)) {
      const sessionEmail = sessionStorage.getItem('passwordResetEmail');
      const sessionOtp = sessionStorage.getItem('passwordResetOtp');
      
      if (!sessionEmail || !sessionOtp) {
        this.errorMessage = 'Session expired. Please restart the forgot password flow.';
        this.isLoading = false;
        return;
      }
      this.email = sessionEmail;
      this.otp = sessionOtp;
    }

    const email = this.email;
    const otpCode = this.otp;

    const payload = {
      email: email,
      otpCode: otpCode,
      newPassword: this.resetForm.get('newPassword')?.value,
      confirmNewPassword: this.resetForm.get('confirmNewPassword')?.value
    };

    console.log('Email from session:', email);
    console.log('OTP from session:', otpCode);
    console.log('Payload:', payload);

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.uiState.showAlert('success', this.t().successMessage);

        if (isPlatformBrowser(this.platformId)) {
          sessionStorage.removeItem('passwordResetEmail');
          sessionStorage.removeItem('passwordResetOtp');
        }

        this.router.navigate([NAV_ROUTES.LOGIN], { replaceUrl: true });
      },
      error: (err: unknown) => {
        this.isLoading = false;
        this.errorMessage = this.authErrorHandler.handle(err);
      }
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    return form.get('newPassword')?.value === form.get('confirmNewPassword')?.value
      ? null
      : { mismatch: true };
  }
}
