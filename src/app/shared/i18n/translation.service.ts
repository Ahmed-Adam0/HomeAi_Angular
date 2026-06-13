import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
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
      if (!environment.production) {
        console.warn('Failed to sync language from backend.', error);
      }
    }
  }

  async syncToBackend(lang: 'en' | 'ar'): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const profile = await firstValueFrom(
        this.http.get<Record<string, any>>(`${this.baseUrl}profile`)
      );
      await firstValueFrom(
        this.http.put(`${this.baseUrl}profile`, {
          ...profile,
          preferredLanguage: lang
        })
      );
    } catch (error) {
      if (!environment.production) {
        console.warn('Failed to persist language to backend.', error);
      }
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
