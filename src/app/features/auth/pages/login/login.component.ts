import { Component, computed, inject , OnInit, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule ,isPlatformBrowser} from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import{environment} from '../../../../../environments/environment';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  
})
export class Login implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }



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
        const destination = this.returnUrl || NAV_ROUTES.HOME;
        this.router.navigateByUrl(destination, { replaceUrl: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.localizeBackendError(err.error);
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

    this.authService.loginWithGoogleIdToken(idToken).subscribe({
      next: () => {
        this.isLoading = false;
        if (this.authService.isVendor()) {
          console.warn('[Google Login] - Vendor account detected on customer login. Rejecting and logging out.');
          this.authService.logout();
          this.errorMessage = this.currentLang() === 'ar'
            ? 'حسابات الموردين غير مسموح لها بتسجيل الدخول من هنا. يرجى استخدام بوابة الموردين.'
            : 'Vendor accounts are not allowed to log in here. Please use the Vendor Portal.';
          return;
        }
        const destination = this.returnUrl || NAV_ROUTES.HOME;
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

    const defaultMessage = this.currentLang() === 'ar'
      ? this.translations.ar.defaultLoginError
      : this.translations.en.defaultLoginError;

    if (typeof errorPayload?.message === 'string') {
      return errorPayload.message;
    }

    return defaultMessage;
  }
}
