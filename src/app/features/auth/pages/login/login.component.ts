import { Component, computed, inject , OnInit, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule ,isPlatformBrowser} from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthErrorHandler } from '../../services/auth-error-handler.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import{environment} from '../../../../../environments/environment';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AutoDirectionDirective],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],

})
export class Login implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authErrorHandler = inject(AuthErrorHandler);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  loginForm: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  returnUrl = '';
  backendErrors: Record<string, string> = {};

  readonly navRoutes = NAV_ROUTES;
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'مرحباً بك مجدداً',
      pageSubtitle: 'سجّل دخولك لمتابعة تصميم مساحتك المثالية',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'أدخل بريدك الإلكتروني',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'صيغة البريد غير صحيحة.',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: 'أدخل كلمة المرور',
      passwordRequired: 'كلمة المرور مطلوبة.',
      forgotPassword: 'نسيت كلمة المرور؟',
      loginButton: 'تسجيل الدخول',
      continueWith: 'أو تابع بواسطة',
      noAccountText: 'ليس لديك حساب؟',
      createAccountLink: 'إنشاء حساب جديد',
      visualHeading: 'صمّم مساحة أحلامك',
      visualSubtitle: 'استخدم الذكاء الاصطناعي لتصور الأثاث في غرفتك قبل الشراء. احصل على توصيات مخصصة بناءً على ذوقك وتفضيلاتك الفريدة.',
      socialGoogle: 'Google',
      defaultLoginError: 'بيانات الدخول غير صحيحة، حاول مجدداً.',
      loginAsVendor: 'تسجيل الدخول كمورد'
    },
    en: {
      pageTitle: 'Welcome back',
      pageSubtitle: 'Sign in to continue designing your ideal space',
      emailLabel: 'Email Address',
      emailPlaceholder: 'Enter your email',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      passwordRequired: 'Password is required.',
      forgotPassword: 'Forgot password?',
      loginButton: 'Sign In',
      continueWith: 'Or continue with',
      noAccountText: "Don't have an account?",
      createAccountLink: 'Create new account',
      visualHeading: 'Design your dream space',
      visualSubtitle: 'Use AI to preview furniture in your room before purchase. Get personalized recommendations based on your unique taste and preferences.',
      socialGoogle: 'Google',
      defaultLoginError: 'Login failed. Please check your credentials and try again.',
      loginAsVendor: 'Login as Vendor'
    }
  } as const;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '';

    ['email', 'password'].forEach(field => {
      this.loginForm.get(field)?.valueChanges.subscribe(() => {
        if (this.backendErrors[field]) {
          delete this.backendErrors[field];
          const control = this.loginForm.get(field);
          if (control) {
            const { backend, ...rest } = control.errors || {};
            control.setErrors(Object.keys(rest).length > 0 ? rest : null);
            control.markAsTouched();
          }
        }
      });
    });
  }

  showValidation(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    if (!control) return false;
    if (this.backendErrors[controlName]) return true;
    return (control.touched || control.dirty || this.submitted) && control.invalid;
  }

  showSuccess(controlName: string): boolean {
    const control = this.loginForm.get(controlName);
    if (!control) return false;
    return (control.touched || control.dirty || this.submitted) && control.valid && !!control.value;
  }

  getFieldError(controlName: string): string {
    return this.backendErrors[controlName] || '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.backendErrors = {};

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.authService.isVendor()) {
          console.warn('[Login] - Vendor account detected on customer login. Rejecting and logging out.');
          this.authService.logout();
          this.errorMessage = this.currentLang() === 'ar'
            ? 'حسابات الموردين غير مسموح لها بتسجيل الدخول من هنا. يرجى استخدام بوابة الموردين.'
            : 'Vendor accounts are not allowed to log in here. Please use the Vendor Portal.';
          return;
        }
        this.translationService.syncFromBackend();
        const destination = this.returnUrl || NAV_ROUTES.HOME;
        this.router.navigateByUrl(destination, { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.authErrorHandler.handle(err, 'login');
      }
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.isBrowser) {
      return;
    }
    this.loadGoogleIdentityServices();
  }
   onGoogleLogin(): void {
    this.promptGoogleSignIn();
  }

  private loadGoogleIdentityServices(): void {
    if (!this.isBrowser) {
      return;
    }

    if ((window as any).google?.accounts?.id) {
      this.initializeGoogleIdentity();
      return;
    }

    const scriptId = 'google-identity-services-script';
    if (document.getElementById(scriptId)) {
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => this.initializeGoogleIdentity();
    script.onerror = () => {
      console.error('Failed to load Google Identity Services script.');
    };
    document.head.appendChild(script);
  }

  private initializeGoogleIdentity(): void {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: any) => this.handleGoogleCredentialResponse(response),
      ux_mode: 'popup',
      context: 'signin'
    });

    google.accounts.id.renderButton(
      document.getElementById('google-signin-btn'),
      { theme: 'outline', size: 'large', width: 350, text: 'signin_with', shape: 'rectangular' }
    );
  }

  private promptGoogleSignIn(): void {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      this.loadGoogleIdentityServices();
      return;
    }

    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'outline', size: 'large', width: 350 }
        );
      }
    });
  }

  private handleGoogleCredentialResponse(response: any): void {
    const idToken = response?.credential;
    if (!idToken) {
      this.errorMessage = this.currentLang() === 'ar'
        ? 'فشل تسجيل الدخول عبر Google. حاول مجدداً.'
        : 'Google sign-in failed. Please try again.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.loginWithGoogleIdToken(idToken, this.translationService.currentLang()).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        
        if (response?.data?.registrationRequired) {
          const registrationToken = response.data.registrationToken;
          const googleProfile = response.data.googleProfile;
          this.authService.saveGoogleRegistrationState(registrationToken, googleProfile);
          this.router.navigate([NAV_ROUTES.COMPLETE_GOOGLE_REGISTRATION]);
          return;
        }

        if (this.authService.isVendor()) {
          console.warn('[Google Login] - Vendor account detected on customer login. Rejecting and logging out.');
          this.authService.logout();
          this.errorMessage = this.currentLang() === 'ar'
            ? 'حسابات الموردين غير مسموح لها بتسجيل الدخول من هنا. يرجى استخدام بوابة الموردين.'
            : 'Customer accounts are not allowed to log in here.';
          return;
        }
        this.translationService.syncFromBackend();
        const destination = this.returnUrl || NAV_ROUTES.HOME;
        this.router.navigateByUrl(destination, { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.authErrorHandler.handle(err, 'login');
      }
    });
  }
}
