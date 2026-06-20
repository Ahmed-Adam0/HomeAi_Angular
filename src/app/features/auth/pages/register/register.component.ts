import { Component, computed, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthErrorHandler } from '../../services/auth-error-handler.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { AutoDirectionDirective } from '../../../../shared/directives/auto-direction.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AutoDirectionDirective],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class Register implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private authErrorHandler = inject(AuthErrorHandler);
  private router = inject(Router);
  private translationService = inject(TranslationService);

  registerForm: FormGroup;
  isLoading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  backendErrors: Record<string, string> = {};
  private successTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'أنشئ حسابك الجديد',
      pageSubtitle: 'ابدأ رحلتك لتصميم بيتك الذكي واستكشاف الماركت بليس',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك الثلاثي',
      fullNameRequired: 'يرجى إدخال الاسم بالكامل.',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'your@example.com',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'يرجى إدخال بريد إلكتروني صحيح.',
      emailAlreadyExists: 'البريد الإلكتروني مستخدم بالفعل.',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '01xxxxxxxxx',
      phoneRequired: 'رقم الهاتف مطلوب.',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'كلمة المرور مطلوبة.',
      passwordWeak: 'يجب أن تحتوي كلمة المرور على حرف كبير وصغير ورقم ورمز خاص.',
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
      successMessage: 'تم إنشاء الحساب بنجاح. يرجى تفعيل البريد الإلكتروني للمتابعة.',
    },
    en: {
      pageTitle: 'Create your new account',
      pageSubtitle: 'Start your journey to smart home design and explore the marketplace',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      fullNameRequired: 'Please enter your full name.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'your@example.com',
      emailRequired: 'Email address is required.',
      emailInvalid: 'Please enter a valid email address.',
      emailAlreadyExists: 'An account with this email already exists.',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '01xxxxxxxxx',
      phoneRequired: 'Phone number is required.',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'Password is required.',
      passwordWeak: 'Password must contain uppercase, lowercase, number, and special character.',
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
      successMessage: 'Account created successfully. Please verify your email to continue.',
    }
  } as const;

  constructor() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordComplexityValidator
      ]],
      confirmPassword: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0125][0-9]{8}$/)]],
      preferredLanguage: ['ar']
    }, { validators: this.passwordMatchValidator });

    ['fullName', 'email', 'password', 'confirmPassword', 'phoneNumber'].forEach(field => {
      this.registerForm.get(field)?.valueChanges.subscribe(() => {
        if (this.backendErrors[field]) {
          delete this.backendErrors[field];
          const control = this.registerForm.get(field);
          if (control) {
            const { backend, emailAlreadyExists, ...rest } = control.errors || {};
            control.setErrors(Object.keys(rest).length > 0 ? rest : null);
            control.markAsTouched();
          }
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
  }

  private passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value || '';
    if (!value) return null;

    const hasUppercase = /[A-Z]/.test(value);
    const hasLowercase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);

    if (hasUppercase && hasLowercase && hasNumber && hasSpecial) return null;

    return { weak: { hasUppercase, hasLowercase, hasNumber, hasSpecial } };
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  get passwordStrength() {
    const pass = this.registerForm.get('password')?.value || '';
    return {
      hasLength: pass.length >= 8,
      hasUppercase: /[A-Z]/.test(pass),
      hasLowercase: /[a-z]/.test(pass),
      hasNumber: /[0-9]/.test(pass),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)
    };
  }

  showValidation(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    if (!control) return false;
    if (this.backendErrors[controlName]) return true;
    return (control.touched || control.dirty || this.submitted) && control.invalid;
  }

  showSuccess(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    if (!control) return false;
    return (control.touched || control.dirty || this.submitted) && control.valid && !!control.value;
  }

  getFieldError(controlName: string): string {
    return this.backendErrors[controlName] || '';
  }

  onSubmit(): void {
    this.submitted = true;
    this.backendErrors = {};

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.registerForm.value;

    this.authService.register(formData).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = this.t().successMessage;
        this.translationService.setLanguage(formData.preferredLanguage as 'en' | 'ar');
        this.successTimeout = setTimeout(() => {
          this.router.navigate([NAV_ROUTES.CONFIRM_EMAIL_OTP], {
            queryParams: { email: formData.email }
          });
        }, 3000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = this.authErrorHandler.handle(err);

        const fieldErrors = this.authErrorHandler.getFieldErrors(err, {
          'Email': 'email',
          'Password': 'password',
          'FullName': 'fullName',
          'PhoneNumber': 'phoneNumber',
          'ConfirmPassword': 'confirmPassword'
        });

        for (const fe of fieldErrors) {
          this.backendErrors[fe.field] = fe.message;
          const control = this.registerForm.get(fe.field);
          if (control) {
            if (fe.field === 'email' && fe.errorKey === 'emailAlreadyExists') {
              control.setErrors({ emailAlreadyExists: true });
            } else {
              control.setErrors({ ...control.errors, backend: true });
            }
            control.markAsTouched();
          }
        }
      }
    });
  }
}
