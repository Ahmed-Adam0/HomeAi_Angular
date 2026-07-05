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
import { CurrencyFormatPipe } from '../../../shared/pipes/currency-format.pipe';
import { NotificationBellComponent } from '../../../features/notifications/components/notification-bell/notification-bell.component';
import { IFavoriteItem } from '../../../features/favorites/interfaces/ifavorite-item';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    TranslatePipe,
    LocalizedPipe,
    CurrencyFormatPipe,
    NotificationBellComponent,
    ThemeToggleComponent
  ],
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
  readonly isCartDropdownOpen = signal<boolean>(false);
  readonly isScrolled = signal<boolean>(false);
  readonly isHeaderHidden = signal<boolean>(false);
  readonly favoritesCount = signal<number>(0);

  private cartDropdownTimeout: ReturnType<typeof setTimeout> | null = null;
  private languageDropdownTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly cartItems = computed(() => this.cartService.items());
  readonly cartSubtotal = computed(() => this.cartService.subtotal());

  private lastScrollY = 0;
  private readonly SCROLL_THRESHOLD = 50;
  private scrollRAF = 0;

  readonly cartCount = computed(() => this.cartService.itemCount());
  readonly isAuthenticated = this.authService.isAuthenticated;
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

  public isNavLinkActive(route: string, labelEn: string): boolean {
    this.currentUrl(); // reactive tracking dependency

    if (labelEn === 'AI Accent') {
      return (
        this.router.isActive('/room-upload', false) ||
        this.router.isActive('/ai-chat', false) ||
        this.router.isActive('/ai-result', false) ||
        this.router.isActive('/scan-room', false) ||
        this.router.isActive('/rooms', false)
      );
    }
    if (labelEn === 'Products') {
      return (
        this.router.isActive(NAV_ROUTES.PRODUCTS, false) ||
        this.router.isActive(NAV_ROUTES.SEARCH, false) ||
        this.router.isActive(NAV_ROUTES.CATEGORIES, false)
      );
    }
    return this.router.isActive(route, route === '/');
  }

  updateActiveLink(url: string): void {
    if (this.isNavLinkActive(NAV_ROUTES.PRODUCTS, 'Products')) {
      this.activeMainLink.set('Products');
    } else if (this.isNavLinkActive(NAV_ROUTES.ROOM_UPLOAD, 'AI Accent')) {
      this.activeMainLink.set('AI Accent');
    } else if (this.isNavLinkActive(NAV_ROUTES.INSPIRATIONS, 'Inspirations')) {
      this.activeMainLink.set('Inspirations');
    } else if (this.isNavLinkActive(NAV_ROUTES.HOME, 'Home')) {
      this.activeMainLink.set('Home');
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
    event.preventDefault();
    event.stopPropagation();
    const currentState = this.isLanguageDropdownOpen();
    this.closeAllFloatingDropdowns();
    this.isLanguageDropdownOpen.set(!currentState);
  }

  openLanguageDropdown(): void {
    if (this.languageDropdownTimeout) {
      clearTimeout(this.languageDropdownTimeout);
      this.languageDropdownTimeout = null;
    }
    this.isLanguageDropdownOpen.set(true);
  }

  closeLanguageDropdownWithDelay(): void {
    this.languageDropdownTimeout = setTimeout(() => {
      this.isLanguageDropdownOpen.set(false);
    }, 250);
  }

  cancelLanguageDropdownClose(): void {
    if (this.languageDropdownTimeout) {
      clearTimeout(this.languageDropdownTimeout);
      this.languageDropdownTimeout = null;
    }
  }

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.isProfileDropdownOpen.update((prev) => !prev);
    this.isLanguageDropdownOpen.set(false);
  }

  selectLanguage(lang: LanguageOption): void {
    console.log(`[Navbar.selectLanguage] called with code=${lang.code}`);
    this.selectedLanguage.set(lang);
    this.isLanguageDropdownOpen.set(false);
    this.translationService.setLanguage(lang.code);
    console.log('[Navbar.selectLanguage] calling syncToBackend');
    this.translationService.syncToBackend(lang.code as 'en' | 'ar');
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

  openCartDropdown(): void {
    if (this.cartDropdownTimeout) {
      clearTimeout(this.cartDropdownTimeout);
      this.cartDropdownTimeout = null;
    }
    this.isCartDropdownOpen.set(true);
  }

  closeCartDropdownWithDelay(): void {
    this.cartDropdownTimeout = setTimeout(() => {
      this.isCartDropdownOpen.set(false);
    }, 250);
  }

  cancelCartDropdownClose(): void {
    if (this.cartDropdownTimeout) {
      clearTimeout(this.cartDropdownTimeout);
      this.cartDropdownTimeout = null;
    }
  }

  toggleCartDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const currentState = this.isCartDropdownOpen();
    this.closeAllFloatingDropdowns();
    this.isCartDropdownOpen.set(!currentState);
  }

  removeCartItem(itemId: string, event: Event): void {
    event.stopPropagation();
    this.cartService.removeFromCart(itemId);
  }

  onCartImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) img.src = 'assets/images/image-placeholder.svg';
  }

  closeAllFloatingDropdowns(): void {
    if (this.cartDropdownTimeout) {
      clearTimeout(this.cartDropdownTimeout);
      this.cartDropdownTimeout = null;
    }
    if (this.languageDropdownTimeout) {
      clearTimeout(this.languageDropdownTimeout);
      this.languageDropdownTimeout = null;
    }
    this.isLanguageDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
    this.isCartDropdownOpen.set(false);
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
