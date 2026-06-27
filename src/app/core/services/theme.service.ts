import { Injectable, signal, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { THEMES, Theme } from '../constants/theme.constants';
import { LOCAL_STORAGE_KEYS } from '../constants/localstorage-keys';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  // Core theme signal
  readonly currentThemeSignal = signal<Theme>(THEMES.LIGHT);

  // Derived signal for easy consumption
  readonly isDarkSignal = computed(() => this.currentThemeSignal() === THEMES.DARK);

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Synchronize with the data-theme attribute set by the blocking index.html script
      const activeAttr = document.documentElement.getAttribute('data-theme') as Theme | null;
      const initialTheme = (activeAttr === THEMES.DARK || activeAttr === THEMES.LIGHT) ? activeAttr : THEMES.LIGHT;
      
      this.currentThemeSignal.set(initialTheme);
      this.updateMetaThemeColor(initialTheme);

      // Enable smooth transitions only after the initial page paint
      setTimeout(() => {
        document.documentElement.classList.add('theme-ready');
      }, 100);

      // Listen to OS theme changes if user hasn't explicitly set a preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (event) => {
        const storedPreference = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as Theme | null;
        if (!storedPreference) {
          const systemTheme = event.matches ? THEMES.DARK : THEMES.LIGHT;
          this.setTheme(systemTheme, false);
        }
      });
    }
  }

  /**
   * Sets the active theme mode.
   * @param theme Theme type to set.
   * @param persist If true, persists the choice to localStorage.
   */
  setTheme(theme: Theme, persist = true): void {
    this.currentThemeSignal.set(theme);

    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', theme);
      this.updateMetaThemeColor(theme);

      if (persist) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, theme);
      }
    }
  }

  /**
   * Toggles the active theme between Light and Dark modes.
   */
  toggleTheme(): void {
    const nextTheme = this.currentThemeSignal() === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    this.setTheme(nextTheme, true);
  }

  /**
   * Returns the current active theme.
   */
  currentTheme(): Theme {
    return this.currentThemeSignal();
  }

  /**
   * Updates the HTML <meta name="theme-color"> header tag to match the theme.
   */
  private updateMetaThemeColor(theme: Theme): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let metaTag = document.getElementById('meta-theme-color') || document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', 'theme-color');
      metaTag.setAttribute('id', 'meta-theme-color');
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', theme === THEMES.DARK ? '#12100e' : '#F8F6F2');
  }
}
