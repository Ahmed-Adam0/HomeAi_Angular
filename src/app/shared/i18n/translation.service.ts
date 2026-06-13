import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private baseUrl = environment.apiUrl;
  
  readonly currentLang = signal<'en' | 'ar'>('en');
  readonly translations = signal<Record<string, string>>({});

  async initLanguage(): Promise<void> {
    let lang: 'en' | 'ar' = 'en';
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('lang');
      if (saved === 'en' || saved === 'ar') {
        lang = saved;
      } else {
        const browserLang = navigator.language.split('-')[0];
        lang = browserLang === 'ar' ? 'ar' : 'en';
      }
    }
    await this.setLanguage(lang);

    // Background sync: if authenticated, overlay the backend language preference
    if (isPlatformBrowser(this.platformId) && this.hasAuthToken()) {
      this.syncFromBackend();
    }
  }

  async setLanguage(lang: 'en' | 'ar'): Promise<void> {
    this.currentLang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      try {
        const data = await firstValueFrom(
          this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`)
        );
        this.translations.set(data);
      } catch (error) {
        console.error(`Failed to load translations for: ${lang}`, error);
      }
    } else {
      this.translations.set({});
    }
  }

  async syncFromBackend(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const profile = await firstValueFrom(
        this.http.get<{ preferredLanguage?: string }>(`${this.baseUrl}profile`)
      );
      const backendLang = profile.preferredLanguage;
      if (backendLang === 'en' || backendLang === 'ar') {
        if (backendLang !== this.currentLang()) {
          await this.setLanguage(backendLang);
        }
      }
    } catch (error) {
      console.warn('Failed to sync language from backend.', error);
    }
  }

  async syncToBackend(lang: 'en' | 'ar'): Promise<void> {
    console.log(`[syncToBackend] ENTERED with lang=${lang}, browser=${isPlatformBrowser(this.platformId)}, hasAuth=${this.hasAuthToken()}`);
    if (!isPlatformBrowser(this.platformId)) {
      console.warn('[syncToBackend] Not browser, skipping');
      return;
    }
    if (!this.hasAuthToken()) {
      console.warn('[syncToBackend] No auth token, skipping. User must be logged in to persist language.');
      return;
    }

    const url = `${this.baseUrl}profile`;
    console.log(`[syncToBackend] Starting GET ${url}`);

    try {
      const profile = await firstValueFrom(
        this.http.get<{
          fullName: string;
          userName?: string | null;
          email: string;
          phoneNumber?: string | null;
          preferredLanguage?: string;
          addresses?: Array<{
            id?: string;
            label?: string;
            addressLine1: string;
            addressLine2?: string;
            city?: string;
            country?: string;
            postalCode?: string;
            primary?: boolean;
          }>;
          profileImage?: string | null;
        }>(url)
      );

      console.log('[syncToBackend] GET profile succeeded', profile);

      // Sanitize addresses exactly like ProfileService.updateProfile does
      const sanitizedAddresses = (profile.addresses || []).map((addr) => {
        const isTemporaryId = typeof addr.id === 'string' && String(addr.id).startsWith('addr_');
        return {
          ...(isTemporaryId || !addr.id ? {} : { id: addr.id }),
          label: addr.label,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          country: addr.country,
          postalCode: addr.postalCode,
          primary: addr.primary,
        };
      });

      const putPayload = {
        fullName: profile.fullName ?? '',
        userName: profile.userName ?? null,
        email: profile.email ?? null,
        phoneNumber: profile.phoneNumber ?? null,
        preferredLanguage: lang,
        addresses: sanitizedAddresses,
        profileImage: profile.profileImage ?? null,
      };
      console.log(`[syncToBackend] Sending PUT ${url} with payload:`, putPayload);

      await firstValueFrom(
        this.http.put(url, putPayload)
      );

      console.log(`[syncToBackend] PUT succeeded. preferredLanguage=${lang}`);

      // After successful backend persistence, update the local auth user state
      this.authService.updateUserProfile({ preferredLanguage: lang });
      console.log('[syncToBackend] AuthService updated');
    } catch (error) {
      console.error('[syncToBackend] FAILED to persist language preference to backend.', error);
    }
  }

  translate(key: string): string {
    return this.translations()[key] || key;
  }

  private hasAuthToken(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!localStorage.getItem('furniture_access_token');
    }
    return false;
  }
}
