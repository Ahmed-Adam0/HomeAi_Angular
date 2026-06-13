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

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AutoDirectionDirective],
  templateUrl: './verify-otp.component.html',
  styleUrls: ['../login/login.component.css']
})
export class VerifyOtp {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authErrorHandler = inject(AuthErrorHandler);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private uiState = inject(UiState);

  otpForm: FormGroup;
  isLoading = false;
  errorMessage = '';

  readonly navRoutes = NAV_ROUTES;
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'تحقق من رمز OTP',
      pageSubtitle: 'أدخل البريد الإلكتروني والرمز المرسل لاستكمال التحقق.',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'صيغة البريد غير صحيحة.',
      otpLabel: 'رمز التحقق',
      otpPlaceholder: 'أدخل رمز OTP',
      otpRequired: 'رمز التحقق مطلوب.',
      submitButton: 'تحقق الآن',
      loginLink: 'تسجيل الدخول',
      visualHeading: 'رمز التحقق المطلوب',
      visualSubtitle: 'يجب تأكيد هويتك قبل إعادة تعيين كلمة المرور.',
      successMessage: 'تم التحقق من الرمز بنجاح. انتقل إلى إعادة تعيين كلمة المرور.'
    },
    en: {
      pageTitle: 'Verify OTP',
      pageSubtitle: 'Enter your email and the verification code to continue.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      otpLabel: 'Verification Code',
      otpPlaceholder: 'Enter your OTP code',
      otpRequired: 'OTP code is required.',
      submitButton: 'Verify Now',
      loginLink: 'Sign In',
      visualHeading: 'OTP verification required',
      visualSubtitle: 'We need to confirm your identity before resetting your password.',
      successMessage: 'OTP verified successfully. Redirecting to reset password.'
    }
  } as const;

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';

    this.otpForm = this.fb.group({
      email: [email, [Validators.required, Validators.email]],
      otpCode: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  onSubmit(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyOtp(this.otpForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.uiState.showAlert('success', this.t().successMessage);
        this.router.navigate([NAV_ROUTES.RESET_PASSWORD], {
          queryParams: { email: this.otpForm.value.email }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.authErrorHandler.handle(err);
      }
    });
  }
}
