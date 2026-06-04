import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { VendorAuthService } from '../../services/vendor-auth.service';
import { NAV_ROUTES } from '../../../../core/constants';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { phoneValidator, passwordMatchValidator } from '../../../../shared/validators';
import { IVendorRegisterRequest } from '../../interfaces/vendor-auth-request';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';

type VendorAddressForm = FormGroup<{
  city: FormControl<string>;
  area: FormControl<string>;
  street: FormControl<string>;
  buildingNumber: FormControl<string>;
  notes: FormControl<string>;
}>;

type VendorRegisterForm = FormGroup<{
  fullName: FormControl<string>;
  email: FormControl<string>;
  phoneNumber: FormControl<string>;
  password: FormControl<string>;
  confirmPassword: FormControl<string>;
  preferredLanguage: FormControl<string>;
  workshopNameAr: FormControl<string>;
  workshopNameEn: FormControl<string>;
  descriptionAr: FormControl<string>;
  descriptionEn: FormControl<string>;
  workshopAddress: VendorAddressForm;
}>;

@Component({
  selector: 'app-vendor-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent],
  templateUrl: './vendor-register.component.html',
  styleUrls: ['./vendor-register.component.css']
})
export class VendorRegister {
  private fb = inject(FormBuilder);
  private vendorAuthService = inject(VendorAuthService);
  private router = inject(Router);
  private translationService = inject(TranslationService);

  registerForm: VendorRegisterForm;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  readonly navRoutes = NAV_ROUTES;
  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      pageTitle: 'سجّل كمورد',
      pageSubtitle: 'أنشئ حساب مورد لإدارة ورشتك وطلباتها بسهولة',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك الكامل',
      fullNameRequired: 'الاسم الكامل مطلوب.',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'workshop@example.com',
      emailRequired: 'البريد الإلكتروني مطلوب.',
      emailInvalid: 'يرجى إدخال بريد إلكتروني صالح.',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '+201XXXXXXXXX',
      phoneRequired: 'رقم الهاتف مطلوب.',
      phoneInvalid: 'يرجى إدخال رقم هاتف صالح.',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'كلمة المرور مطلوبة.',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      passwordMismatch: 'كلمتا المرور غير متطابقتين.',
      preferredLanguageLabel: 'اللغة المفضلة',
      workshopNameArLabel: 'اسم الورشة بالعربية',
      workshopNameEnLabel: 'اسم الورشة بالإنجليزية',
      workshopNameRequired: 'اسم الورشة مطلوب.',
      descriptionArLabel: 'وصف الورشة بالعربية',
      descriptionEnLabel: 'وصف الورشة بالإنجليزية',
      descriptionRequired: 'الوصف مطلوب.',
      addressLabel: 'عنوان الورشة',
      cityLabel: 'المدينة',
      areaLabel: 'المنطقة',
      streetLabel: 'الشارع',
      buildingNumberLabel: 'رقم المبنى',
      notesLabel: 'ملاحظات إضافية',
      registerButton: 'إنشاء حساب مورد',
      haveAccountText: 'لديك حساب مورد بالفعل؟',
      loginLink: 'سجل الدخول الآن',
      visualHeading: 'انطلق بورشة ذكية',
      visualSubtitle: 'انضم لتتبع الطلبات، المبيعات، وإدارة معلومات الورشة من لوحة واحدة.',
      successMessage: 'تم إنشاء الحساب بنجاح! جاري تحويلك لصفحة تسجيل الدخول...',
      defaultRegisterError: 'فشل التسجيل. تحقق من المعلومات وحاول مرة أخرى.'
    },
    en: {
      pageTitle: 'Register as a Vendor',
      pageSubtitle: 'Create a vendor account to manage your workshop easily',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      fullNameRequired: 'Full name is required.',
      emailLabel: 'Email Address',
      emailPlaceholder: 'workshop@example.com',
      emailRequired: 'Email is required.',
      emailInvalid: 'Please enter a valid email address.',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '+201XXXXXXXXX',
      phoneRequired: 'Phone number is required.',
      phoneInvalid: 'Please enter a valid phone number.',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      passwordRequired: 'Password is required.',
      confirmPasswordLabel: 'Confirm Password',
      passwordMismatch: 'Passwords do not match.',
      preferredLanguageLabel: 'Preferred Language',
      workshopNameArLabel: 'Workshop Name (Arabic)',
      workshopNameEnLabel: 'Workshop Name (English)',
      workshopNameRequired: 'Workshop name is required.',
      descriptionArLabel: 'Description (Arabic)',
      descriptionEnLabel: 'Description (English)',
      descriptionRequired: 'Description is required.',
      addressLabel: 'Workshop Address',
      cityLabel: 'City',
      areaLabel: 'Area',
      streetLabel: 'Street',
      buildingNumberLabel: 'Building Number',
      notesLabel: 'Notes',
      registerButton: 'Create Vendor Account',
      haveAccountText: 'Already have a vendor account?',
      loginLink: 'Sign in now',
      visualHeading: 'Start your smart workshop',
      visualSubtitle: 'Join to track orders, revenue, and workshop details from a single dashboard.',
      successMessage: 'Account created successfully! Redirecting to sign in...',
      defaultRegisterError: 'Registration failed. Please verify your information.'
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
    this.registerForm = this.fb.nonNullable.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, phoneValidator()]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      preferredLanguage: ['ar', [Validators.required]],
      workshopNameAr: ['', [Validators.required, Validators.minLength(3)]],
      workshopNameEn: ['', [Validators.required, Validators.minLength(3)]],
      descriptionAr: ['', [Validators.required, Validators.minLength(5)]],
      descriptionEn: ['', [Validators.required, Validators.minLength(5)]],
      workshopAddress: this.fb.nonNullable.group({
        city: ['', [Validators.required]],
        area: ['', [Validators.required]],
        street: ['', [Validators.required]],
        buildingNumber: ['', [Validators.required]],
        notes: ['']
      })
    }, { validators: passwordMatchValidator('password', 'confirmPassword') });
  }

  get addressGroup(): VendorAddressForm {
    return this.registerForm.get('workshopAddress') as VendorAddressForm;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const value = this.registerForm.getRawValue();
    const payload: IVendorRegisterRequest = {
      fullName: value.fullName,
      email: value.email,
      password: value.password,
      phoneNumber: value.phoneNumber,
      preferredLanguage: value.preferredLanguage,
      workshopNameAr: value.workshopNameAr,
      workshopNameEn: value.workshopNameEn,
      descriptionAr: value.descriptionAr,
      descriptionEn: value.descriptionEn,
      workshopAddress: {
        city: value.workshopAddress.city,
        area: value.workshopAddress.area,
        street: value.workshopAddress.street,
        buildingNumber: value.workshopAddress.buildingNumber,
        notes: value.workshopAddress.notes || ''
      }
    };

    this.vendorAuthService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = this.t().successMessage;
        setTimeout(() => {
          this.router.navigate([NAV_ROUTES.VENDOR_LOGIN]);
        }, 1800);
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
