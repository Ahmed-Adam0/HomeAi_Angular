import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../login/login.component.css']
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translationService = inject(TranslationService);
  private uiState = inject(UiState);

  forgotForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  readonly navRoutes = NAV_ROUTES;
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'نسيت كلمة المرور',
      pageSubtitle: 'أدخل بريدك الإلكتروني لاستعادة الوصول إلى حسابك.',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'صيغة البريد غير صحيحة.',
      submitButton: 'أرسل رابط الاستعادة',
      loginLink: 'تسجيل الدخول',
      visualHeading: 'استعادة الحساب بسهولة',
      visualSubtitle: 'سنرسل رمز التحقق إلى بريدك الإلكتروني لإكمال عملية إعادة تعيين كلمة المرور.',
      successMessage: 'تم إرسال تعليمات إعادة التعيين إلى بريدك الإلكتروني.'
    },
    en: {
      pageTitle: 'Forgot Password',
      pageSubtitle: 'Enter your email to regain access to your account.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      submitButton: 'Send recovery link',
      loginLink: 'Sign In',
      visualHeading: 'Recover your account',
      visualSubtitle: 'We will send a verification code to your email to reset your password.',
      successMessage: 'Recovery instructions have been sent to your email.'
    }
  } as const;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.forgotForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.uiState.showAlert('success', this.t().successMessage);
        this.router.navigate([NAV_ROUTES.VERIFY_OTP], {
          queryParams: { email: this.forgotForm.value.email }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.localizeBackendError(err.error);
      }
    });
  }

  private localizeBackendError(errorPayload: any): string {
    if (typeof errorPayload?.message === 'string') {
      return errorPayload.message;
    }

    return this.currentLang() === 'ar'
      ? this.translations.ar.emailInvalid
      : this.translations.en.emailInvalid;
  }
}
