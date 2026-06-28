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

  // Signal to check if circular reveal is currently animating
  readonly isTransitioningSignal = signal<boolean>(false);

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
   * Toggles the active theme with a premium page-wide circular reveal transition.
   */
  toggleThemeWithReveal(x: number, y: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.toggleTheme();
      return;
    }

    if (this.isTransitioningSignal()) {
      return;
    }

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.toggleTheme();
      return;
    }

    // Expose click coordinates to CSS
    document.documentElement.style.setProperty('--reveal-x', `${x}px`);
    document.documentElement.style.setProperty('--reveal-y', `${y}px`);

    const nextTheme = this.currentThemeSignal() === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;

    // Create the magical energy wave element in the DOM
    const wave = document.createElement('div');
    wave.className = 'theme-wave-element';
    wave.style.setProperty('--reveal-x', `${x}px`);
    wave.style.setProperty('--reveal-y', `${y}px`);

    if (nextTheme === THEMES.DARK) {
      wave.style.setProperty('--wave-color', '#818cf8'); // Radiant indigo
      wave.style.setProperty('--wave-glow-color', 'rgba(99, 102, 241, 0.7)'); // Cosmic violet glow
    } else {
      wave.style.setProperty('--wave-color', '#fbbf24'); // Sun amber gold
      wave.style.setProperty('--wave-glow-color', 'rgba(245, 158, 11, 0.75)'); // Golden sunrise glow
    }

    document.body.appendChild(wave);
    wave.getBoundingClientRect(); // Force browser reflow to register state
    wave.classList.add('active');

    // Remove the energy wave element after it finishes expanding across the viewport
    setTimeout(() => {
      wave.remove();
    }, 900);

    const doc = document as any;
    if (doc.startViewTransition) {
      this.isTransitioningSignal.set(true);
      document.documentElement.classList.add('theme-transitioning');

      const transition = doc.startViewTransition(() => {
        this.toggleTheme();
      });

      transition.finished.then(() => {
        document.documentElement.classList.remove('theme-transitioning');
        this.isTransitioningSignal.set(false);
      });
    } else {
      // Fallback circular reveal overlay for browsers without View Transition API
      this.isTransitioningSignal.set(true);
      document.documentElement.classList.add('theme-transitioning');

      const overlay = document.createElement('div');
      overlay.className = 'theme-reveal-overlay-circular';
      overlay.style.setProperty('--reveal-x', `${x}px`);
      overlay.style.setProperty('--reveal-y', `${y}px`);
      overlay.style.backgroundColor = nextTheme === THEMES.DARK ? '#12100e' : '#faf9f6';
      document.body.appendChild(overlay);

      // Force browser reflow to register initial state
      overlay.getBoundingClientRect();

      // Trigger the clip-path expansion
      overlay.classList.add('active');

      // Swap the theme variables halfway through the animation (at 350ms)
      setTimeout(() => {
        this.setTheme(nextTheme, true);
      }, 350);

      // Clean up after the transition finishes (800ms)
      setTimeout(() => {
        overlay.remove();
        document.documentElement.classList.remove('theme-transitioning');
        this.isTransitioningSignal.set(false);
      }, 800);
    }
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
