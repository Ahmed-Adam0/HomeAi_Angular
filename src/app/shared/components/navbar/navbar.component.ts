import {
  Component,
  inject,
  signal,
  input,
  model,
  output,
  computed,
  PLATFORM_ID,
  OnInit,
  HostListener,
  DestroyRef,
  effect,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../shared/pipes/localized.pipe';
import {
  LanguageOption,
  NavLink,
} from '../../../shared/interfaces/navbar.interfaces';
import * as Constants from '../../../core/constants/navbar.constants';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../../../core/constants';
import { AuthService } from '../../../features/auth/services/auth.service';
import { CartService } from '../../../features/cart/services/cart.service';
import { NotificationBellComponent } from '../../../features/notifications/components/notification-bell/notification-bell.component';
import { IFavoriteItem } from '../../../features/favorites/interfaces/ifavorite-item';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, LocalizedPipe, NotificationBellComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class Navbar implements OnInit {
  protected readonly translationService = inject(TranslationService);
  protected readonly authService = inject(AuthService);
  protected readonly cartService = inject(CartService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly navRoutes = NAV_ROUTES;

  readonly languages = input<LanguageOption[]>(Constants.LANGUAGES);
  readonly mainNavLinks = input<NavLink[]>(Constants.MAIN_NAV_LINKS);

  readonly activeMainLink = model<string>('');
  readonly selectedLanguage = model<LanguageOption>(Constants.LANGUAGES[0]);

  readonly languageChange = output<LanguageOption>();
  readonly mainLinkClick = output<string>();

  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly isLanguageDropdownOpen = signal<boolean>(false);
  readonly isProfileDropdownOpen = signal<boolean>(false);
  readonly isScrolled = signal<boolean>(false);
  readonly isHeaderHidden = signal<boolean>(false);
  readonly favoritesCount = signal<number>(0);

  private lastScrollY = 0;
  private readonly SCROLL_THRESHOLD = 50;
  private scrollRAF = 0;

  readonly cartCount = computed(() => this.cartService.itemCount());
  readonly currentUrl = signal<string>('');

  readonly userAvatarSrc = computed<string | null>(() => {
    const user = this.authService.currentUser();
    return user?.image || null;
  });

  protected avatarError = signal(false);
  private lastErroredSrc: string | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.currentUrl.set(this.router.url);
    this.updateActiveLink(this.router.url);

    effect(() => {
      const currentLang = this.translationService.currentLang();
      const match = Constants.LANGUAGES.find((l) => l.code === currentLang);
      if (match) {
        this.selectedLanguage.set(match);
      }
    });

    effect(() => {
      const src = this.userAvatarSrc();
      this.avatarError.set(false);
      if (src === null) {
        this.lastErroredSrc = null;
      }
    });

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        this.currentUrl.set(url);
        this.updateActiveLink(url);
        this.refreshFavoritesCount();
        this.cartService.refreshFromStorage();
      });
  }

  ngOnInit(): void {
    this.updateActiveLink(this.router.url);
    this.refreshFavoritesCount();
    this.cartService.refreshFromStorage();
  }

  @HostListener('document:click', [])
  onDocumentClick(): void {
    this.closeAllFloatingDropdowns();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.scrollRAF !== 0) return;

    this.scrollRAF = requestAnimationFrame(() => {
      this.scrollRAF = 0;

      const currentScrollY = window.scrollY;

      if (currentScrollY <= 10) {
        this.isHeaderHidden.set(false);
        this.isScrolled.set(false);
        this.lastScrollY = currentScrollY;
        return;
      }

      this.isScrolled.set(true);

      if (currentScrollY > this.lastScrollY && currentScrollY > this.SCROLL_THRESHOLD) {
        this.isHeaderHidden.set(true);
      } else if (currentScrollY <= this.lastScrollY) {
        this.isHeaderHidden.set(false);
      }

      this.lastScrollY = currentScrollY;
    });
  }

  @HostListener('document:keydown.escape', [])
  onEscapePressed(): void {
    this.closeAllFloatingDropdowns();
    this.isMobileMenuOpen.set(false);
  }

  @HostListener('window:storage', ['$event'])
  onStorageEvent(event: StorageEvent): void {
    if (event.key === LOCAL_STORAGE_KEYS.FAVORITES || event.key === null) {
      this.refreshFavoritesCount();
    }
    if (event.key === LOCAL_STORAGE_KEYS.CART || event.key === null) {
      this.cartService.refreshFromStorage();
    }
  }

  updateActiveLink(url: string): void {
    const path = url.split('?')[0];
    if (path === NAV_ROUTES.PRODUCTS || path.startsWith(`${NAV_ROUTES.CATEGORIES}/`) || path === NAV_ROUTES.SEARCH) {
      this.activeMainLink.set('Products');
    } else if (path.startsWith('/rooms')) {
      this.activeMainLink.set('AI Accent');
    } else if (path.startsWith('/inspirations')) {
      this.activeMainLink.set('Inspirations');
    } else if (path.startsWith('/offers')) {
      this.activeMainLink.set('Offers & promotions');
    } else {
      this.activeMainLink.set('');
    }
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((prev) => !prev);
    if (this.isMobileMenuOpen()) {
      this.closeAllFloatingDropdowns();
    }
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.isLanguageDropdownOpen.update((prev) => !prev);
    this.isProfileDropdownOpen.set(false);
  }

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.isProfileDropdownOpen.update((prev) => !prev);
    this.isLanguageDropdownOpen.set(false);
  }

  selectLanguage(lang: LanguageOption): void {
    this.selectedLanguage.set(lang);
    this.isLanguageDropdownOpen.set(false);
    this.translationService.setLanguage(lang.code);
    this.languageChange.emit(lang);
  }

  selectMainLink(link: string): void {
    this.activeMainLink.set(link);
    this.mainLinkClick.emit(link);
    this.isMobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.authService.logout();
    this.isProfileDropdownOpen.set(false);
    void this.router.navigate([NAV_ROUTES.LOGIN]);
  }

  closeAllFloatingDropdowns(): void {
    this.isLanguageDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
  }

  onAvatarError(): void {
    const currentSrc = this.userAvatarSrc();
    // Ignore stale error events from null/empty src
    if (!currentSrc) return;
    // Ignore if this URL already errored (avoid redundant error state)
    if (this.lastErroredSrc === currentSrc) return;
    this.lastErroredSrc = currentSrc;
    this.avatarError.set(true);
  }

  private refreshFavoritesCount(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.favoritesCount.set(0);
      return;
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
      if (!raw) {
        this.favoritesCount.set(0);
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.favoritesCount.set(parsed.length);
        return;
      }

      if (
        parsed &&
        typeof parsed === 'object' &&
        'items' in parsed &&
        Array.isArray((parsed as { items: unknown }).items)
      ) {
        this.favoritesCount.set((parsed as { items: IFavoriteItem[] }).items.length);
        return;
      }

      this.favoritesCount.set(0);
    } catch {
      this.favoritesCount.set(0);
    }
  }
}
