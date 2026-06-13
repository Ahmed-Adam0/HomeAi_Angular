import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError } from 'rxjs';
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
  id?: string;
  name: string;
  email: string;
  initials: string;
  tier: string;
  workshopId?: number;
  image?: string;
  preferredLanguage?: 'en' | 'ar';
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
  private profileImageFetched = false;

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  readonly isAuthenticated = computed(() => !!this.authToken());
  readonly currentUser = computed(() => this.userProfile());
  readonly isVendor = computed(() => {
    const user = this.userProfile();
    return !!(user && user.workshopId);
  });
  readonly isCustomer = computed(() => {
    const user = this.userProfile();
    return !!(user && !user.workshopId);
  });

  constructor() {
    if (this.isBrowser) {
      const savedToken = localStorage.getItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      if (savedToken) {
        this.setAuthState(savedToken);
        this.restoreCachedAvatar();
        this.ensureProfileImage();
      }
    }
  }

  register(data: IRegisterRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.baseUrl}${API_URLS.AUTH.REGISTER}`, data);
  }

  login(data: ILoginRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.baseUrl}${API_URLS.AUTH.LOGIN}`, data).pipe(
      tap((response: any) => {
        const token = this.getAuthToken(response);
        if (!token) {
          return;
        }
        const workshopId = response.workshopId || response.workshop?.id || (response.user && response.user.workshopId) || (response.data && response.data.workshopId) || (response.result && response.result.workshopId);
        if (workshopId && this.isBrowser) {
          localStorage.setItem('workshopId', String(workshopId));
        }
        this.setAuthState(token);
        this.applyResponseAvatar(response);
      })
    );
  }

  vendorLogin(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}Vendors/login`, data).pipe(
      tap((response) => {
        const token = this.getAuthToken(response);
        if (!token) {
          return;
        }
        const workshopId = response.workshopId || response.workshop?.id || (response.user && response.user.workshopId) || (response.data && response.data.workshopId) || (response.result && response.result.workshopId);
        if (workshopId && this.isBrowser) {
          localStorage.setItem('workshopId', String(workshopId));
        }
        this.setAuthState(token);
        this.applyResponseAvatar(response);
      })
    );
  }

  authenticate(token: string): void {
    this.setAuthState(token);
  }
  loginWithGoogleIdToken(idToken: string): Observable<any> {
    return this.http.post(`${this.baseUrl}${API_URLS.AUTH.GOOGLE_LOGIN}`, { idToken }).pipe(
      tap((response: any) => {
        const token = this.getAuthToken(response);
        if (!token) {
          return;
        }
        const workshopId =
          response.workshopId ||
          response.workshop?.id ||
          (response.user && response.user.workshopId) ||
          (response.data && response.data.workshopId) ||
          (response.result && response.result.workshopId);
        if (workshopId && this.isBrowser) {
          localStorage.setItem('workshopId', String(workshopId));
        }
        this.setAuthState(token);
        this.applyResponseAvatar(response);
      })
    );
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

  /**
   * Updates the locally cached user profile (name, email, image, preferredLanguage) without
   * re-decoding the JWT. Call this after the profile API returns updated data
   * so that navbar and other components reading `currentUser()` reflect
   * the change immediately.
   */
  updateUserProfile(updates: { name?: string; email?: string; image?: string; preferredLanguage?: 'en' | 'ar' }): void {
    this.userProfile.update((current) => {
      if (!current) return current;
      const next = { ...current };
      if (updates.name !== undefined) {
        next.name = updates.name;
        next.initials = updates.name
          .split(' ')
          .map((p: string) => p[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
      }
      if (updates.email !== undefined) next.email = updates.email;
      if (updates.image !== undefined) next.image = updates.image;
      if (updates.preferredLanguage !== undefined) next.preferredLanguage = updates.preferredLanguage;
      return next;
    });
    if (updates.image !== undefined && this.isBrowser) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AVATAR_URL, updates.image);
    }
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.AVATAR_URL);
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
      localStorage.setItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN, token);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.ACCESS_TOKEN);
    }
  }

  private clearAuthState(): void {
    this.authToken.set(null);
    this.userProfile.set(null);
  }

  private decodeToken(token: string): AuthProfile {
    const fallbackUser: AuthProfile = {
      id: '',
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
      const id =
        payload['nameid'] ||
        payload['sub'] ||
        payload['id'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
        '';
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

      let workshopId: number | undefined;
      const workshopIdRaw =
        payload['workshopId'] ||
        payload['WorkshopId'] ||
        payload['workshop_id'] ||
        payload['workshop'] ||
        payload['sid'] ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/sid'];
      if (workshopIdRaw) {
        workshopId = Number(workshopIdRaw);
      } else if (this.isBrowser) {
        const stored = localStorage.getItem('workshopId') || localStorage.getItem('workshop_id');
        if (stored) {
          workshopId = Number(stored);
        }
      }

      const image = payload['picture'] || payload['image'] || payload['avatar'] || '';

      return {
        id,
        name,
        email,
        initials,
        image,
        tier: fallbackUser.tier,
        workshopId
      };
    } catch (error) {
      console.warn('Failed to decode auth token payload.', error);
      let workshopId: number | undefined;
      if (this.isBrowser) {
        const stored = localStorage.getItem('workshopId') || localStorage.getItem('workshop_id');
        if (stored) {
          workshopId = Number(stored);
        }
      }
      return {
        ...fallbackUser,
        workshopId
      };
    }
  }

  private ensureProfileImage(): void {
    const current = this.userProfile();
    if (!current || current.image || this.profileImageFetched) return;
    this.profileImageFetched = true;
    setTimeout(() => {
      this.http.get<{ profileImage?: string }>(`${this.baseUrl}${API_URLS.PROFILE.GET}`)
        .pipe(catchError(() => of(undefined)))
        .subscribe((data) => {
          if (data?.profileImage) {
            this.updateUserProfile({ image: data.profileImage });
          }
        });
    });
  }

  private applyResponseAvatar(response: any): void {
    const avatarUrl =
      response.user?.avatarUrl ||
      response.user?.image ||
      response.user?.picture ||
      '';
    if (!avatarUrl) return;
    this.userProfile.update((p) => {
      if (!p || p.image) return p;
      return { ...p, image: avatarUrl };
    });
    if (this.isBrowser) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.AVATAR_URL, avatarUrl);
    }
  }

  private restoreCachedAvatar(): void {
    const profile = this.userProfile();
    if (!profile || profile.image) return;
    const cached = localStorage.getItem(LOCAL_STORAGE_KEYS.AVATAR_URL);
    if (cached) {
      this.userProfile.update((p) => p ? { ...p, image: cached } : p);
    }
  }

  private getAuthToken(response: IAuthResponse): string | null {
    return response.token ?? response.accessToken ?? response.data?.token ?? response.result?.token ?? null;
  }
}