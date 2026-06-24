import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslationService } from '../../../shared/i18n/translation.service';

export interface FieldError {
  field: string;
  message: string;
  errorKey?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthErrorHandler {
  private translationService = inject(TranslationService);

  private get lang() {
    return this.translationService.currentLang();
  }

  handle(error: unknown, context?: 'login'): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.msg('حدث خطأ غير متوقع. حاول مجدداً.', 'An unexpected error occurred. Please try again.');
    }

    if (error.status === 0) {
      return this.msg(
        'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت.',
        'Unable to connect to the server. Please check your internet connection.'
      );
    }

    const body = error.error;
    if (!body || typeof body !== 'object') {
      return this.msg('حدث خطأ غير متوقع. حاول مجدداً.', 'An unexpected error occurred. Please try again.');
    }

    // 1. Check error code first (most specific)
    const code = body?.code || body?.errorCode;
    if (code) {
      const known = this.codeMap.get(code);
      if (known) return this.msg(known.ar, known.en);
    }

    // 2. Check ValidationProblemDetails format: { errors: { "Email": ["msg1"], "Password": ["msg2"] } }
    const firstFieldError = this.extractFirstValidationError(body);
    if (firstFieldError) {
      const localized = this.localizeMessage(firstFieldError);
      if (localized) {
        if (context === 'login' && this.isAuthErrorMessage(localized)) {
          return this.getUnifiedLoginError();
        }
        return localized;
      }
    }

    // 3. Check array errors format: { errors: [{ field: "Email", message: "msg" }] }
    if (Array.isArray(body.errors) && body.errors.length > 0) {
      const firstErr = body.errors[0];
      const msg = firstErr?.message || firstErr?.title || '';
      if (msg) {
        const localized = this.localizeMessage(msg);
        if (localized) {
          if (context === 'login' && this.isAuthErrorMessage(localized)) {
            return this.getUnifiedLoginError();
          }
          return localized;
        }
      }
    }

    // 4. Check body.message
    if (typeof body?.message === 'string' && body.message.trim()) {
      const localized = this.localizeMessage(body.message);
      if (localized) {
        if (context === 'login' && this.isAuthErrorMessage(localized)) {
          return this.getUnifiedLoginError();
        }
        return localized;
      }
    }

    // 5. Check body.error (alternative to body.message, used by some backends)
    if (typeof body?.error === 'string' && body.error.trim()) {
      const localized = this.localizeMessage(body.error);
      if (localized) {
        if (context === 'login' && this.isAuthErrorMessage(localized)) {
          return this.getUnifiedLoginError();
        }
        return localized;
      }
    }

    // 6. Check body.detail (ProblemDetails format)
    if (typeof body?.detail === 'string' && body.detail.trim()) {
      const localized = this.localizeMessage(body.detail);
      if (localized) {
        if (context === 'login' && this.isAuthErrorMessage(localized)) {
          return this.getUnifiedLoginError();
        }
        return localized;
      }
    }

    // 7. Check body.title (ProblemDetails format)
    if (typeof body?.title === 'string' && body.title.trim()) {
      const localized = this.localizeMessage(body.title);
      if (localized) {
        if (context === 'login' && this.isAuthErrorMessage(localized)) {
          return this.getUnifiedLoginError();
        }
        return localized;
      }
    }

    // 8. HTTP status fallback — for login, override auth-related statuses
    if (context === 'login' && (error.status === 401 || error.status === 400)) {
      return this.getUnifiedLoginError();
    }
    const statusHandler = this.statusMap.get(error.status);
    if (statusHandler) return this.msg(statusHandler.ar, statusHandler.en);

    return this.msg('حدث خطأ غير متوقع. حاول مجدداً.', 'An unexpected error occurred. Please try again.');
  }

  getFieldErrors(error: unknown, fieldMap: Record<string, string>): FieldError[] {
    if (!(error instanceof HttpErrorResponse)) return [];

    const body = error.error;
    if (!body || typeof body !== 'object') return [];

    const result: FieldError[] = [];

    // Format 1: ASP.NET ValidationProblemDetails
    // { errors: { "Email": ["msg1", "msg2"], "Password": ["msg1"] } }
    if (body.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
      for (const [backendField, messages] of Object.entries(body.errors)) {
        const controlName = fieldMap[backendField] || this.toCamelCase(backendField);
        const msg = Array.isArray(messages) ? messages[0] : String(messages);
        if (msg) {
          const localized = this.localizeMessage(msg);
          const errorKey = this.detectErrorKey(backendField, msg);
          result.push({ field: controlName, message: localized || msg, errorKey });
        }
      }
      return result;
    }

    // Format 2: Array of error objects with field property
    // { errors: [{ field: "Email", message: "...", code: "..." }] }
    if (Array.isArray(body.errors)) {
      for (const err of body.errors) {
        if (err?.field) {
          const controlName = fieldMap[err.field] || this.toCamelCase(err.field);
          const msg = err.message || err.title || '';
          if (msg) {
            const localized = this.localizeMessage(msg);
            const errorKey = err.code?.toLowerCase() || this.detectErrorKey(err.field, msg);
            result.push({ field: controlName, message: localized || msg, errorKey });
          }
        }
      }
      return result;
    }

    return result;
  }

  private detectErrorKey(backendField: string, rawMessage: string): string | undefined {
    const lower = rawMessage.toLowerCase();

    if (backendField.toLowerCase() === 'email') {
      if (lower.includes('already exists') || lower.includes('already taken') ||
          lower.includes('already registered') || lower.includes('already in use') ||
          lower.includes('مستخدم')) {
        return 'emailAlreadyExists';
      }
    }

    if (lower.includes('invalid credentials') || lower.includes('wrong password') ||
        lower.includes('incorrect password') || lower.includes('invalid login attempt') ||
        lower.includes('login failed') || lower.includes('incorrect email')) {
      return 'invalidCredentials';
    }

    if (lower.includes('account locked') || lower.includes('تم قفل')) {
      return 'accountLocked';
    }

    if (lower.includes('not confirmed') || lower.includes('غير مؤكد')) {
      return 'emailNotConfirmed';
    }

    return undefined;
  }

  private extractFirstValidationError(body: any): string | null {
    if (body?.errors && typeof body.errors === 'object' && !Array.isArray(body.errors)) {
      const entries = Object.entries(body.errors);
      if (entries.length > 0) {
        const [, messages] = entries[0];
        const msg = Array.isArray(messages) ? messages[0] : String(messages);
        if (msg && typeof msg === 'string') return msg;
      }
    }
    return null;
  }

  localizeMessage(message: string): string | null {
    if (!message || typeof message !== 'string') return null;
    const lower = message.toLowerCase().trim();

    // 1. Detect and distinguish status types first
    if (lower.includes('pending')) {
      return this.msg(
        'حسابك في انتظار موافقة الإدارة. يرجى الانتظار حتى يتم مراجعة طلبك',
        'Your account is pending admin approval. Please wait until your request is reviewed.'
      );
    }
    if (lower.includes('suspended') || lower.includes('rejected') || lower.includes('removed') || lower.includes('inactive') || lower.includes('deactivated')) {
      return this.msg(
        'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني',
        'You have been removed by the admin. Please contact support.'
      );
    }
    if (lower.includes('email format') || lower.includes('invalid email format') || lower.includes('email is invalid') || lower.includes('email address is invalid')) {
      return this.msg(
        'يرجى إدخال بريد إلكتروني صحيح',
        'Please enter a valid email address'
      );
    }
    if (lower.includes('invalid credentials') || lower.includes('wrong password') || lower.includes('incorrect password') || lower.includes('incorrect email') || lower.includes('user not found') || lower.includes('login failed')) {
      return this.msg(
        'البريد الإلكتروني أو كلمة المرور غير صحيحة',
        'Email or password is incorrect'
      );
    }

    // Try exact match
    const exact = this.messagePatternMap.get(lower);
    if (exact) return this.msg(exact.ar, exact.en);

    // Try contains match (longest pattern first to avoid partial matches)
    const sortedPatterns = [...this.messagePatternMap.entries()]
      .sort((a, b) => b[0].length - a[0].length);
    for (const [pattern, translations] of sortedPatterns) {
      if (lower.includes(pattern)) {
        return this.msg(translations.ar, translations.en);
      }
    }

    return null;
  }

  private isAuthErrorMessage(message: string): boolean {
    const lower = message.toLowerCase();
    return lower.includes('البريد') || lower.includes('كلمة المرور') ||
           lower.includes('credentials') || lower.includes('password') ||
           lower.includes('email') || lower.includes('login') ||
           lower.includes('account') || lower.includes('authentication') ||
           lower.includes('تسجيل') || lower.includes('دخول') ||
           lower.includes('حساب');
  }

  private getUnifiedLoginError(): string {
    return this.msg(
      'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      'Email or password is incorrect'
    );
  }

  private toCamelCase(str: string): string {
    if (!str) return '';
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  private msg(ar: string, en: string): string {
    return this.lang === 'ar' ? ar : en;
  }

  private readonly messagePatternMap = new Map<string, { ar: string; en: string }>([
    // Email / Password / Format (Unified per user request: "Email or password is incorrect" / "البريد الإلكتروني أو كلمة المرور غير صحيحة")
    ['incorrect email or password', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['wrong password', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['incorrect password', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['invalid credentials', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['invalid login attempt', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['login failed', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['incorrect email', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['user not found', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['no user found', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['could not be found', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['invalid email', { ar: 'يرجى إدخال بريد إلكتروني صحيح', en: 'Please enter a valid email address' }],
    ['email format', { ar: 'يرجى إدخال بريد إلكتروني صحيح', en: 'Please enter a valid email address' }],

    // Suspended / Admin Removed
    ['removed by the admin', { ar: 'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني', en: 'You have been removed by the admin. Please contact support.' }],
    ['deactivated or suspended', { ar: 'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني', en: 'You have been removed by the admin. Please contact support.' }],
    ['account is inactive', { ar: 'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني', en: 'You have been removed by the admin. Please contact support.' }],
    ['suspended', { ar: 'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني', en: 'You have been removed by the admin. Please contact support.' }],
    ['rejected', { ar: 'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني', en: 'You have been removed by the admin. Please contact support.' }],

    // Pending Approval
    ['pending admin approval', { ar: 'حسابك في انتظار موافقة الإدارة. يرجى الانتظار حتى يتم مراجعة طلبك', en: 'Your account is pending admin approval. Please wait until your request is reviewed.' }],
    ['pending approval', { ar: 'حسابك في انتظار موافقة الإدارة. يرجى الانتظار حتى يتم مراجعة طلبك', en: 'Your account is pending admin approval. Please wait until your request is reviewed.' }],

    // Others
    ['email already exists', { ar: 'البريد الإلكتروني مستخدم بالفعل.', en: 'An account with this email already exists.' }],
    ['email already in use', { ar: 'البريد الإلكتروني مستخدم بالفعل.', en: 'An account with this email already exists.' }],
    ['is already taken', { ar: 'البريد الإلكتروني مستخدم بالفعل.', en: 'An account with this email already exists.' }],
    ['already registered', { ar: 'البريد الإلكتروني مستخدم بالفعل.', en: 'An account with this email already exists.' }],
    ['invalid phone', { ar: 'رقم الهاتف غير صالح.', en: 'The phone number is invalid.' }],
    ['passwords do not match', { ar: 'كلمتا المرور غير متطابقتين.', en: 'Passwords do not match.' }],
    ['password is too weak', { ar: 'كلمة المرور ضعيفة جداً.', en: 'Password is too weak.' }],
    ['weak password', { ar: 'كلمة المرور ضعيفة جداً.', en: 'Password is too weak.' }],
    ['account locked', { ar: 'تم قفل الحساب مؤقتاً.', en: 'Account is locked.' }],
    ['account exists', { ar: 'الحساب موجود بالفعل.', en: 'An account already exists.' }],
    ['otp expired', { ar: 'انتهت صلاحية رمز التحقق.', en: 'OTP has expired.' }],
    ['invalid otp', { ar: 'رمز التحقق غير صحيح.', en: 'Invalid OTP code.' }],
    ['invalid token', { ar: 'الرابط غير صالح.', en: 'Invalid or expired link.' }],
    ['token expired', { ar: 'انتهت صلاحية الجلسة.', en: 'Session expired.' }],
    ['too many attempts', { ar: 'محاولات كثيرة جداً.', en: 'Too many attempts.' }],
    ['rate limit', { ar: 'محاولات كثيرة جداً.', en: 'Too many requests.' }],
    ['email not confirmed', { ar: 'البريد الإلكتروني غير مؤكد.', en: 'Email not confirmed.' }],
    ['one or more validation errors', { ar: 'يرجى مراجعة الحقول التي تحمل أخطاء.', en: 'Please check the fields with errors below.' }],
    ['google-authenticated users cannot change their email address manually', { ar: 'لا يمكن لمستخدمي مصادقة Google تغيير بريدهم الإلكتروني يدوياً.', en: 'Google-authenticated users cannot change their email address manually.' }],
    ['google users cannot change their email address', { ar: 'لا يمكن لمستخدمي مصادقة Google تغيير بريدهم الإلكتروني يدوياً.', en: 'Google-authenticated users cannot change their email address manually.' }],
  ]);

  private readonly codeMap = new Map<string, { ar: string; en: string }>([
    ['INVALID_CREDENTIALS', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['USER_NOT_FOUND', { ar: 'البريد الإلكتروني أو كلمة المرور غير صحيحة', en: 'Email or password is incorrect' }],
    ['INVALID_EMAIL', { ar: 'يرجى إدخال بريد إلكتروني صحيح', en: 'Please enter a valid email address' }],
    ['PENDING_APPROVAL', { ar: 'حسابك في انتظار موافقة الإدارة. يرجى الانتظار حتى يتم مراجعة طلبك', en: 'Your account is pending admin approval. Please wait until your request is reviewed.' }],
    ['ACCOUNT_PENDING_APPROVAL', { ar: 'حسابك في انتظار موافقة الإدارة. يرجى الانتظار حتى يتم مراجعة طلبك', en: 'Your account is pending admin approval. Please wait until your request is reviewed.' }],
    
    ['ACCOUNT_LOCKED', { ar: 'تم قفل الحساب مؤقتاً. تواصل مع الدعم.', en: 'Your account is temporarily locked. Please contact support.' }],
    ['EMAIL_EXISTS', { ar: 'البريد الإلكتروني مستخدم بالفعل. حاول بريداً آخر.', en: 'This email is already in use. Please use a different email.' }],
    ['INVALID_PHONE', { ar: 'رقم الهاتف غير صالح. تأكد من كتابة رقم صحيح.', en: 'The phone number is invalid. Please provide a valid number.' }],
    ['ACCOUNT_EXISTS', { ar: 'الحساب موجود بالفعل. قم بتسجيل الدخول أو استخدم بريداً آخر.', en: 'An account already exists with this information. Please log in or use a different email.' }],
    ['ACCOUNT_NOT_FOUND', { ar: 'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.', en: 'No account found with this email address.' }],
    ['INVALID_OTP', { ar: 'رمز التحقق غير صحيح. حاول مجدداً.', en: 'Invalid verification code. Please try again.' }],
    ['OTP_EXPIRED', { ar: 'انتهت صلاحية رمز التحقق. أعد طلب رمز جديد.', en: 'Verification code has expired. Please request a new one.' }],
    ['INVALID_TOKEN', { ar: 'الرابط غير صالح أو منتهي الصلاحية.', en: 'The link is invalid or has expired.' }],
    ['TOKEN_EXPIRED', { ar: 'انتهت صلاحية الجلسة. أعد المحاولة.', en: 'Session expired. Please try again.' }],
    ['PASSWORDS_DONT_MATCH', { ar: 'كلمتا المرور غير متطابقتين.', en: 'Passwords do not match.' }],
    ['WEAK_PASSWORD', { ar: 'كلمة المرور ضعيفة جداً. استخدم كلمة أقوى.', en: 'Password is too weak. Please use a stronger password.' }],
    ['EMAIL_NOT_CONFIRMED', { ar: 'البريد الإلكتروني غير مؤكد. يرجى تأكيد بريدك الإلكتروني أولاً.', en: 'Email not confirmed. Please confirm your email first.' }],
    ['RATE_LIMITED', { ar: 'محاولات كثيرة جداً. حاول لاحقاً.', en: 'Too many attempts. Please try again later.' }],
    ['GOOGLE_AUTH_FAILED', { ar: 'فشل تسجيل الدخول عبر Google. حاول مجدداً.', en: 'Google sign-in failed. Please try again.' }],
  ]);

  private readonly statusMap = new Map<number, { ar: string; en: string }>([
    [400, { ar: 'طلب غير صحيح. تحقق من البيانات.', en: 'Invalid request. Please check your input.' }],
    [401, { ar: 'انتهت صلاحية الجلسة. سجّل الدخول مجدداً.', en: 'Session expired. Please log in again.' }],
    [403, { ar: 'تم طردك من قبل الإدارة. يرجى التواصل مع الدعم الفني', en: 'You have been removed by the admin. Please contact support.' }],
    [404, { ar: 'المورد المطلوب غير موجود.', en: 'The requested resource was not found.' }],
    [422, { ar: 'البيانات المدخلة غير صحيحة. راجع الحقول.', en: 'The submitted data is invalid. Please review the fields.' }],
    [429, { ar: 'محاولات كثيرة جداً. حاول لاحقاً.', en: 'Too many requests. Please try again later.' }],
    [500, { ar: 'خطأ في الخادم. حاول لاحقاً.', en: 'Server error. Please try again later.' }],
    [502, { ar: 'الخادم غير متاح مؤقتاً. حاول لاحقاً.', en: 'Server temporarily unavailable. Please try again later.' }],
    [503, { ar: 'الخدمة غير متاحة حالياً. حاول لاحقاً.', en: 'Service is currently unavailable. Please try again later.' }],
  ]);
}
