import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants/api-urls';
import {
  ILoginRequest,
  IRegisterRequest,
  IForgotPasswordRequest,
  IVerifyOtpRequest,
  IResetPasswordRequest
} from '../interfaces/iauth-request';
import { IAuthResponse } from '../interfaces/iauth-response';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/localstorage-keys';

interface AuthProfile {
  name: string;
  email: string;
  initials: string;
  tier: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = environment.apiUrl;
  private readonly authToken = signal<string | null>(null);
  private readonly userProfile = signal<AuthProfile | null>(null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  readonly isAuthenticated = computed(() => !!this.authToken());
  readonly currentUser = computed(() => this.userProfile());

  constructor() {
    if (this.isBrowser) {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
      if (savedToken) {
        this.setAuthState(savedToken);
      }
    }
  }

  register(data: IRegisterRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.baseUrl}${API_URLS.AUTH.REGISTER}`, data);
  }

  login(data: ILoginRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.baseUrl}${API_URLS.AUTH.LOGIN}`, data).pipe(
      tap((response) => {
        const token = this.getAuthToken(response);
        if (!token) {
          return;
        }
        this.setAuthState(token);
      })
    );
  }

  redirectToGoogleOAuth(returnUrl?: string): void {
    if (!this.isBrowser) {
      return;
    }

    const url = `${this.baseUrl}${API_URLS.AUTH.GOOGLE}`;
    window.location.href = returnUrl
      ? `${url}?returnUrl=${encodeURIComponent(returnUrl)}`
      : url;
  }

  forgotPassword(data: IForgotPasswordRequest) {
    return this.http.post(`${this.baseUrl}${API_URLS.AUTH.FORGOT_PASSWORD}`, data);
  }

  verifyOtp(data: IVerifyOtpRequest) {
    return this.http.post(`${this.baseUrl}${API_URLS.AUTH.VERIFY_OTP}`, data);
  }

  resetPassword(data: IResetPasswordRequest) {
    return this.http.post(`${this.baseUrl}${API_URLS.AUTH.RESET_PASSWORD}`, data);
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    }
    this.clearAuthState();
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private setAuthState(token: string | null): void {
    this.authToken.set(token);
    this.userProfile.set(token ? this.decodeToken(token) : null);

    if (!this.isBrowser) {
      return;
    }

    if (token) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    }
  }

  private clearAuthState(): void {
    this.authToken.set(null);
    this.userProfile.set(null);
  }

  private decodeToken(token: string): AuthProfile {
    const fallbackUser: AuthProfile = {
      name: 'Alexander Wright',
      email: 'alexander@furnimind.ai',
      initials: 'AW',
      tier: '✦ AI Spaces Creator'
    };

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return fallbackUser;
      }

      const payload = JSON.parse(atob(parts[1]));
      const email =
        payload['email'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        fallbackUser.email;
      const name =
        payload['unique_name'] ||
        payload['name'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        fallbackUser.name;
      const initials = name
        .split(' ')
        .map((part: string) => part[0])
        .join('')
        .substring(0, 2)
        .toUpperCase() || 'FM';

      return {
        name,
        email,
        initials,
        tier: fallbackUser.tier
      };
    } catch (error) {
      console.warn('Failed to decode auth token payload.', error);
      return fallbackUser;
    }
  }

  private getAuthToken(response: IAuthResponse): string | null {
    return response.token ?? response.accessToken ?? response.data?.token ?? response.result?.token ?? null;
  }
}
