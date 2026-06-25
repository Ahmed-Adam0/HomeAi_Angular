import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VendorAuthService } from '../../services/vendor-auth.service';
import { AuthService } from '../../../auth/services/auth.service';
import { AuthErrorHandler } from '../../../auth/services/auth-error-handler.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
import { CartService } from '../../../cart/services/cart.service';

@Component({
  selector: 'app-vendor-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AutoDirectionDirective],
  templateUrl: './vendor-login.component.html',
  styleUrls: ['./vendor-login.component.css']
})
export class VendorLogin implements OnInit {
  private fb = inject(FormBuilder);
  private vendorAuthService = inject(VendorAuthService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private cartService = inject(CartService);

  loginForm: FormGroup;
  isLoading = false;
  returnUrl = '';
  private errorPayload = signal<unknown | null>(null);
  private overrideErrorMessage = signal<string | null>(null);
  private backendErrors: Record<string, string> = {};

  // Helper to expose field-specific error messages
  getFieldError(controlName: string): string {
    return this.backendErrors[controlName] || '';
  }
  readonly displayedError = computed(() => {
    const override = this.overrideErrorMessage();
    if (override) {
      return override;
    }
    return this.errorPayload() ? this.authErrorHandler.handle(this.errorPayload()!, 'login') : '';
  });

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

  private readonly authErrorHandler = inject(AuthErrorHandler);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';
  }

  ngOnInit(): void {
    this.cartService.resetUiState();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorPayload.set(null);
    this.overrideErrorMessage.set(null);

    this.vendorAuthService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.authService.isCustomer()) {
          console.warn('[VendorLogin] - Customer account detected on vendor login. Rejecting and logging out.');
          this.authService.logout();
          this.overrideErrorMessage.set(this.currentLang() === 'ar'
            ? 'حسابات العملاء غير مسموح لها بتسجيل الدخول من هنا.'
            : 'Customer accounts are not allowed to log in here.');
          return;
        }
        this.translationService.syncFromBackend();
        const destination = this.returnUrl || NAV_ROUTES.VENDOR_DASHBOARD;
        this.router.navigateByUrl(destination, { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorPayload.set(err);
        // Map backend errors to field-level messages using Customer Auth architecture
        this.backendErrors = {};
        const fieldErrors = this.authErrorHandler.getFieldErrors(err, {
          'Email': 'email',
          'Password': 'password'
        });
        for (const fe of fieldErrors) {
          this.backendErrors[fe.field] = fe.message;
          const control = this.loginForm.get(fe.field);
          if (control) {
            control.setErrors({ ...(control.errors || {}), backend: true });
            control.markAsTouched();
          }
        }
      }
    });
  }
}
