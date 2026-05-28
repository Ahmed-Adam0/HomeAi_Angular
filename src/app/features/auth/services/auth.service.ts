import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ILoginRequest, IRegisterRequest } from '../interfaces/iauth-request';
import { IAuthResponse } from '../interfaces/iauth-response';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/localstorage-keys';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = 'http://home-ai.runasp.net/api/Auth';

  // SSR-safe browser check
  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Reactive Auth Signals
  readonly isAuthenticated = signal<boolean>(false);

  // Computed signal for the current user's profile metadata
  readonly currentUser = computed(() => {
    if (!this.isAuthenticated()) return null;

    const fallbackUser = {
      name: 'Alexander Wright',
      email: 'alexander@furnimind.ai',
      initials: 'AW',
      tier: '✦ AI Spaces Creator'
    };

    if (this.isBrowser) {
      const token = localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            const email = payload['email'] ||
                          payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
                          fallbackUser.email;
            const name = payload['unique_name'] ||
                         payload['name'] ||
                         payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
                         fallbackUser.name;
            const initials = name
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .substring(0, 2)
              .toUpperCase() || 'FM';

            return {
              name,
              email,
              initials,
              tier: fallbackUser.tier
            };
          }
        } catch (e) {
          console.warn('Failed to parse token payload for user info.', e);
        }
      }
    }
    return fallbackUser;
  });

  constructor() {
    if (this.isBrowser) {
      this.isAuthenticated.set(!!localStorage.getItem(LOCAL_STORAGE_KEYS.TOKEN));
    }
  }

  register(data: IRegisterRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.baseUrl}/register`, data);
  }

  login(data: ILoginRequest): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap(response => {
        const token = this.getAuthToken(response);

        if (!token) {
          return;
        }

        if (this.isBrowser) {
          localStorage.setItem(LOCAL_STORAGE_KEYS.TOKEN, token);
        }

        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TOKEN);
    }
    this.isAuthenticated.set(false);
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  private getAuthToken(response: IAuthResponse): string | null {
    return response.token ?? response.accessToken ?? response.data?.token ?? response.result?.token ?? null;
  }
}
