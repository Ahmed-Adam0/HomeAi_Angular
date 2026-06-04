import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VendorAuthService } from '../../services/vendor-auth.service';
import { AuthService } from '../../../auth/services/auth.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

@Component({
  selector: 'app-vendor-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent],
  templateUrl: './vendor-login.component.html',
  styleUrls: ['./vendor-login.component.css']
})
export class VendorLogin {
  private fb = inject(FormBuilder);
  private vendorAuthService = inject(VendorAuthService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);

  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  returnUrl = '';

  readonly navRoutes = NAV_ROUTES;
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'مرحبا بك في بوابة الموردين',
      pageSubtitle: 'سجل دخولك للوصول إلى لوحة تحكم الورشة وإدارة الطلبات',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريد الورشة الإلكتروني',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'يرجى إدخال بريد إلكتروني صالح.',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      passwordRequired: 'كلمة المرور مطلوبة.',
      loginButton: 'تسجيل الدخول',
      forgotPassword: 'نسيت كلمة المرور؟',
      noAccountText: 'ليس لديك حساب مورد؟',
      createAccountLink: 'إنشاء حساب مورد',
      visualHeading: 'إدارة ورشتك بذكاء',
      visualSubtitle: 'سجّل دخولك لاستعراض الطلبات، المبيعات، وإعدادات الورشة بسهولة.',
      defaultLoginError: 'فشل تسجيل الدخول. تحقق من بياناتك وحاول مرة أخرى.',
      loginAsCustomer: 'تسجيل الدخول كمستخدم'
    },
    en: {
      pageTitle: 'Welcome to Vendor Portal',
      pageSubtitle: 'Sign in to access your workshop dashboard and manage orders',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your workshop email',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      passwordRequired: 'Password is required.',
      loginButton: 'Sign In',
      forgotPassword: 'Forgot Password?',
      noAccountText: "Don't have a vendor account?",
      createAccountLink: 'Create vendor account',
      visualHeading: 'Manage your workshop smarter',
      visualSubtitle: 'Log in to review orders, revenue, and workshop settings with ease.',
      defaultLoginError: 'Login failed. Please check your credentials and try again.',
      loginAsCustomer: 'Login as Customer'
    }
  } as const;

  private readonly backendErrorMap = [
    {
      matcher: (payload: any) => payload?.code === 'INVALID_CREDENTIALS' || payload?.message?.toLowerCase().includes('invalid credentials') || payload?.message?.toLowerCase().includes('incorrect password') || payload?.message?.toLowerCase().includes('بيانات الدخول'),
      ar: 'بيانات الدخول غير صحيحة، حاول مجدداً.',
      en: 'Login failed. Please check your credentials and try again.'
    },
    {
      matcher: (payload: any) => payload?.code === 'USER_NOT_FOUND' || payload?.message?.toLowerCase().includes('user not found') || payload?.message?.toLowerCase().includes('المستخدم غير موجود'),
      ar: 'المستخدم غير موجود. تأكد من بياناتك.',
      en: 'User not found. Please verify your login information.'
    },
    {
      matcher: (payload: any) => payload?.code === 'ACCOUNT_LOCKED' || payload?.message?.toLowerCase().includes('account locked') || payload?.message?.toLowerCase().includes('تم قفل الحساب'),
      ar: 'تم قفل الحساب مؤقتاً. تواصل مع الدعم.',
      en: 'Your account is temporarily locked. Please contact support.'
    }
  ];

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.vendorAuthService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.authService.isCustomer()) {
          console.warn('[VendorLogin] - Customer account detected on vendor login. Rejecting and logging out.');
          this.authService.logout();
          this.errorMessage = this.currentLang() === 'ar'
            ? 'حسابات العملاء غير مسموح لها بتسجيل الدخول من هنا.'
            : 'Customer accounts are not allowed to log in here.';
          return;
        }
        const destination = this.returnUrl || NAV_ROUTES.VENDOR_DASHBOARD;
        this.router.navigateByUrl(destination, { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.localizeBackendError(err.error);
      }
    });
  }

  private localizeBackendError(errorPayload: any): string {
    const found = this.backendErrorMap.find(item => item.matcher(errorPayload));
    if (found) {
      return this.currentLang() === 'ar' ? found.ar : found.en;
    }

    if (typeof errorPayload?.message === 'string') {
      return errorPayload.message;
    }

    return this.currentLang() === 'ar'
      ? this.translations.ar.defaultLoginError
      : this.translations.en.defaultLoginError;
  }
}
