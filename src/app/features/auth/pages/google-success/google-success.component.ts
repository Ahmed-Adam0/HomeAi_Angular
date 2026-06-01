import { Component, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { LoadingSpinner } from '../../../../shared/components';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { AppState } from '../../../../core/state/app.state';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../../../../core/constants';

@Component({
  selector: 'app-google-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './google-success.component.html',
  styleUrls: ['./google-success.component.css']
})
export class GoogleSuccess implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private translationService = inject(TranslationService);
  private appState = inject(AppState);
  private platformId = inject(PLATFORM_ID);

  isLoading = true;
  hasError = false;
  errorMessage = '';
  returnUrl = '';

  readonly currentLang = this.translationService.currentLang;
  readonly direction = computed(() => this.currentLang() === 'ar' ? 'rtl' : 'ltr');
  readonly t = computed(() => this.translations[this.currentLang()]);

  private readonly translations = {
    ar: {
      processingOAuth: 'جاري معالجة تسجيل الدخول...',
      processingTitle: 'إعداد حسابك',
      verifyingToken: 'جاري التحقق من بيانات المصادقة',
      almostDone: 'يكاد ينتهي الآن',
      redirecting: 'جاري إعادة التوجيه',
      errorTitle: 'خطأ في المصادقة',
      invalidToken: 'حدث خطأ أثناء معالجة المصادقة. الرجاء المحاولة مجدداً.',
      missingToken: 'بيانات المصادقة ناقصة. يرجى تسجيل الدخول مجدداً.',
      technicalError: 'حدث خطأ تقني. يرجى المحاولة لاحقاً.',
      retryButton: 'العودة إلى تسجيل الدخول',
      contactSupport: 'التواصل مع الدعم'
    },
    en: {
      processingOAuth: 'Processing your sign-in...',
      processingTitle: 'Setting up your account',
      verifyingToken: 'Verifying authentication credentials',
      almostDone: 'Almost done',
      redirecting: 'Redirecting you...',
      errorTitle: 'Authentication Error',
      invalidToken: 'An error occurred while processing authentication. Please try again.',
      missingToken: 'Authentication credentials are missing. Please sign in again.',
      technicalError: 'A technical error occurred. Please try again later.',
      retryButton: 'Back to Sign In',
      contactSupport: 'Contact Support'
    }
  } as const;

  ngOnInit(): void {
    // SSR-safe: only run in browser
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.handleGoogleCallback();
  }

  /**
   * Handle Google OAuth callback
   * Extracts token and returnUrl from query params, validates, stores, and redirects
   */
  private handleGoogleCallback(): void {
    try {
      // Extract query parameters: token and returnUrl
      const token = this.route.snapshot.queryParamMap.get('token');
      this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? NAV_ROUTES.HOME;

      // Validate token exists
      if (!token) {
        this.setError(this.t().missingToken);
        return;
      }

      // Validate token format (basic JWT check: should have 3 parts separated by dots)
      if (!this.isValidTokenFormat(token)) {
        this.setError(this.t().invalidToken);
        return;
      }

      // Store token in localStorage using the established constant
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);

      // Decode token and update global auth state
      const userProfile = this.decodeToken(token);
      if (userProfile) {
        this.appState.setUser({
          id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email
        });
      }

      // Simulate processing time for UX polish (2 seconds)
      setTimeout(() => {
        this.performRedirect();
      }, 2000);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      this.setError(this.t().technicalError);
    }
  }

  /**
   * Validate token format (basic JWT format check)
   */
  private isValidTokenFormat(token: string): boolean {
    if (typeof token !== 'string') {
      return false;
    }
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * Decode JWT token to extract user information
   */
  private decodeToken(token: string): { id: string; name: string; email: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      const id =
        payload['nameid'] ||
        payload['sub'] ||
        payload['id'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        '';

      const email =
        payload['email'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        '';

      const name =
        payload['unique_name'] ||
        payload['name'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        '';

      return {
        id,
        name: name || 'Google User',
        email: email || 'no-email@furnimind.ai'
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  /**
   * Set error state and stop loading
   */
  private setError(message: string): void {
    this.isLoading = false;
    this.hasError = true;
    this.errorMessage = message;
  }

  /**
   * Perform redirect to returnUrl or home
   */
  private performRedirect(): void {
    const destination = this.returnUrl || NAV_ROUTES.HOME;
    this.router.navigateByUrl(destination, { replaceUrl: true });
  }

  /**
   * Retry: redirect back to login page
   */
  onRetry(): void {
    this.router.navigateByUrl(NAV_ROUTES.LOGIN, { replaceUrl: true });
  }

  /**
   * Contact support: placeholder for future integration
   */
  onContactSupport(): void {
    // Future integration: open support chat or navigate to support page
    console.log('Contact support initiated');
  }
}
