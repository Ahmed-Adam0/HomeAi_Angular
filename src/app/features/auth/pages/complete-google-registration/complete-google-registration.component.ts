import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthErrorHandler } from '../../services/auth-error-handler.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';

@Component({
  selector: 'app-complete-google-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AutoDirectionDirective],
  templateUrl: './complete-google-registration.component.html',
  styleUrls: ['./complete-google-registration.component.css']
})
export class CompleteGoogleRegistration implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authErrorHandler = inject(AuthErrorHandler);
  private router = inject(Router);
  private translationService = inject(TranslationService);

  registrationForm: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  hasSession = false;

  registrationToken = '';
  googleProfile: {
    email: string;
    firstName: string;
    lastName: string;
    profileImage: string;
  } | null = null;

  avatarError = false;

  get initials(): string {
    if (!this.googleProfile) return '';
    const firstName = (this.googleProfile.firstName || '').trim();
    const lastName = (this.googleProfile.lastName || '').trim();
    const name = (firstName + ' ' + lastName).trim() || 'Google User';
    return name.charAt(0).toUpperCase();
  }

  onAvatarError(): void {
    this.avatarError = true;
  }

  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'أكمل التسجيل',
      pageSubtitle: 'اختر كلمة مرور لحسابك للمتابعة',
      emailLabel: 'البريد الإلكتروني',
      nameLabel: 'الاسم الكامل',
      passwordLabel: 'كلمة المرور الجديدة',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'كلمة المرور مطلوبة.',
      passwordLength: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل.',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder: '••••••••',
      confirmPasswordRequired: 'يرجى تأكيد كلمة المرور.',
      passwordMismatch: 'كلمتا المرور غير متطابقتين.',
      submitButton: 'أكمل إنشاء الحساب',
      backToLogin: 'العودة لتسجيل الدخول',
      noSession: 'جلسة التسجيل غير صالحة أو منتهية الصلاحية. يرجى العودة والضغط على "تسجيل الدخول عبر Google" مرة أخرى.',
      visualHeading: 'خطوة واحدة تفصلك عن البداية',
      visualSubtitle: 'قم بتأمين حسابك بكلمة مرور للمتابعة واستخدام مميزات FurniMind AI بالكامل.',
    },
    en: {
      pageTitle: 'Complete Registration',
      pageSubtitle: 'Choose a password for your account to continue',
      emailLabel: 'Email Address',
      nameLabel: 'Full Name',
      passwordLabel: 'New Password',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'Password is required.',
      passwordLength: 'Password must be at least 8 characters.',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: '••••••••',
      confirmPasswordRequired: 'Please confirm your password.',
      passwordMismatch: 'Passwords do not match.',
      submitButton: 'Complete Account Creation',
      backToLogin: 'Back to Sign In',
      noSession: 'Registration session is invalid or has expired. Please go back and click "Login with Google" again.',
      visualHeading: 'One step away',
      visualSubtitle: 'Secure your account with a password to continue and fully access FurniMind AI features.',
    }
  } as const;

  constructor() {
    this.registrationForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    const session = this.authService.getGoogleRegistrationState();
    if (session && session.registrationToken) {
      this.hasSession = true;
      this.registrationToken = session.registrationToken;
      this.googleProfile = session.googleProfile;
      this.avatarError = false;
    } else {
      this.hasSession = false;
    }
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  showValidation(controlName: string): boolean {
    const control = this.registrationForm.get(controlName);
    if (!control) return false;
    return (control.touched || control.dirty || this.submitted) && control.invalid;
  }

  showSuccess(controlName: string): boolean {
    const control = this.registrationForm.get(controlName);
    if (!control) return false;
    return (control.touched || control.dirty || this.submitted) && control.valid && !!control.value;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { password, confirmPassword } = this.registrationForm.value;

    this.authService.completeGoogleRegistration({
      registrationToken: this.registrationToken,
      password,
      confirmPassword,
      preferredLanguage: this.translationService.currentLang()
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.translationService.syncFromBackend();
        this.router.navigateByUrl(NAV_ROUTES.HOME, { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.authErrorHandler.handle(err);
      }
    });
  }

  onBackToLogin(): void {
    this.authService.clearGoogleRegistrationState();
    this.router.navigate([NAV_ROUTES.LOGIN], { replaceUrl: true });
  }
}
