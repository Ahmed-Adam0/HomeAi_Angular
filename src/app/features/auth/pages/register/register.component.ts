import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private translationService = inject(TranslationService);

  registerForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'أنشئ حسابك الجديد',
      pageSubtitle: 'ابدأ رحلتك لتصميم بيتك الذكي واستكشاف الماركت بليس',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك الثلاثي',
      fullNameRequired: 'الاسم الكامل مطلوب.',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'your@example.com',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'صيغة البريد غير صحيحة.',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '01xxxxxxxxx',
      phoneRequired: 'رقم الهاتف مطلوب لإتمام التسجيل.',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'كلمة المرور مطلوبة.',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      passwordMismatch: 'كلمتا المرور غير متطابقتين.',
      registerButton: 'إنشاء حساب جديد',
      haveAccountText: 'لديك حساب بالفعل؟',
      loginLink: 'تسجيل الدخول',
      visualHeading: 'انضم إلى مستقبل التصميم الداخلي',
      visualSubtitle: 'أنشئ حساباً لحفظ مشاريعك، وتتبع طلبات الأثاث، والحصول على اقتراحات ذكية مخصصة لغرفتك.',
      feature1: 'معاينة الغرف وتوزيع الأثاث بالذكاء الاصطناعي',
      feature2: 'توصيات ذكية مخصصة لقطع الأثاث المفضلة لديك',
      feature3: 'إمكانية حفظ مشاريع التصميم ومشاركتها فوراً',
      successMessage: 'تم إنشاء الحساب بنجاح! جاري تحويلك لصفحة الدخول...',
      defaultRegisterError: 'حدث خطأ أثناء التسجيل، تأكد من البيانات.'
    },
    en: {
      pageTitle: 'Create your new account',
      pageSubtitle: 'Start your journey to smart home design and explore the marketplace',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      fullNameRequired: 'Full name is required.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'your@example.com',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '01xxxxxxxxx',
      phoneRequired: 'Phone number is required to complete registration.',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'Password is required.',
      confirmPasswordLabel: 'Confirm Password',
      passwordMismatch: 'Passwords do not match.',
      registerButton: 'Create Account',
      haveAccountText: 'Already have an account?',
      loginLink: 'Sign In',
      visualHeading: 'Join the future of interior design',
      visualSubtitle: 'Create an account to save your projects, track furniture orders, and get smart personalized suggestions for your room.',
      feature1: 'Preview rooms and furniture layout with AI',
      feature2: 'Smart personalized recommendations for your favorite pieces',
      feature3: 'Save and share design projects instantly',
      successMessage: 'Account created successfully! Redirecting to login page...',
      defaultRegisterError: 'Registration failed. Please verify your details.'
    }
  } as const;

  private readonly backendErrorMap = [
    {
      matcher: (payload: any) => payload?.code === 'EMAIL_EXISTS' || payload?.message?.toLowerCase().includes('email already') || payload?.message?.toLowerCase().includes('البريد الإلكتروني مستخدم'),
      ar: 'البريد الإلكتروني مستخدم بالفعل. حاول بريداً آخر.',
      en: 'This email is already in use. Please use a different email.'
    },
    {
      matcher: (payload: any) => payload?.code === 'INVALID_PHONE' || payload?.message?.toLowerCase().includes('invalid phone') || payload?.message?.toLowerCase().includes('رقم الهاتف غير صحيح'),
      ar: 'رقم الهاتف غير صالح. تأكد من كتابة رقم صحيح.',
      en: 'The phone number is invalid. Please provide a valid number.'
    },
    {
      matcher: (payload: any) => payload?.code === 'ACCOUNT_EXISTS' || payload?.message?.toLowerCase().includes('account exists') || payload?.message?.toLowerCase().includes('الحساب موجود بالفعل'),
      ar: 'الحساب موجود بالفعل. قم بتسجيل الدخول أو استخدم بريداً آخر.',
      en: 'An account already exists with this information. Please log in or use a different email.'
    }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      preferredLanguage: ['ar']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  get passwordStrength() {
    const pass = this.registerForm.get('password')?.value || '';
    return {
      hasLength: pass.length >= 8,
      hasUppercase: /[A-Z]/.test(pass),
      hasNumber: /[0-9]/.test(pass)
    };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = this.t().successMessage;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
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
      ? this.translations.ar.defaultRegisterError
      : this.translations.en.defaultRegisterError;
  }
}
