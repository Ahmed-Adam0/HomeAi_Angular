import { inject, Injectable, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  readonly currentLang = signal<'en' | 'ar'>('en');
  readonly translations = signal<Record<string, string>>({});

  initLanguage(): Promise<void> {
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
    return this.setLanguage(lang);
  }

  async setLanguage(lang: 'en' | 'ar'): Promise<void> {
    this.currentLang.set(lang);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      
      try {
        // Load translations from assets (mapped from shared/i18n in angular.json)
        const data = await firstValueFrom(
          this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`)
        );
        this.translations.set(data);
      } catch (error) {
        console.error(`Failed to load translations for: ${lang}`, error);
      }
    } else {
      // Server-side context (SSR / Route Prerender / Extraction)
      // Resolve immediately to avoid blocking compilation or Server rendering
      this.translations.set({});
    }
  }

  translate(key: string): string {
    return this.translations()[key] || key;
  }
}
