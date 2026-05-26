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
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import {
  LanguageOption,
  CurrencyOption,
  Category,
  MegaMenuColumn,
  PromoBanner,
  NavLink,
} from '../../../shared/interfaces/navbar.interfaces';
import * as Constants from '../../../core/constants/navbar.constants';
import { LOCAL_STORAGE_KEYS, NAV_ROUTES } from '../../../core/constants';
import { AuthService } from '../../../features/auth/services/auth.service';
import { CategoryService } from '../../../features/categories/services/category.service';
import { CartService } from '../../../features/cart/services/cart.service';
import { IFavoriteItem } from '../../../features/favorites/interfaces/ifavorite-item';
import { SkeletonLoader } from '../skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, SkeletonLoader],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class Navbar implements OnInit {
  protected readonly translationService = inject(TranslationService);
  protected readonly authService = inject(AuthService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly cartService = inject(CartService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly navRoutes = NAV_ROUTES;

  readonly languages = input<LanguageOption[]>(Constants.LANGUAGES);
  readonly currencies = input<CurrencyOption[]>(Constants.CURRENCIES);
  readonly mainNavLinks = input<NavLink[]>(Constants.MAIN_NAV_LINKS);
  readonly categoryItems = input<Category[]>(Constants.CATEGORIES);
  readonly megaMenuColumns = input<MegaMenuColumn[]>(Constants.MEGA_MENU_COLUMNS);
  readonly promoBanner = input<PromoBanner>(Constants.PROMO_BANNER);

  readonly activeMainLink = model<string>('');
  readonly selectedLanguage = model<LanguageOption>(Constants.LANGUAGES[0]);
  readonly selectedCurrency = model<CurrencyOption>(Constants.CURRENCIES[0]);

  readonly languageChange = output<LanguageOption>();
  readonly currencyChange = output<CurrencyOption>();
  readonly searchChange = output<string>();
  readonly mainLinkClick = output<string>();
  readonly categoryClick = output<Category>();
  readonly promoClick = output<PromoBanner>();

  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly isMegaMenuOpen = signal<boolean>(false);
  readonly isLanguageDropdownOpen = signal<boolean>(false);
  readonly isCurrencyDropdownOpen = signal<boolean>(false);
  readonly isProfileDropdownOpen = signal<boolean>(false);
  readonly activeMobileAccordion = signal<string | null>(null);
  readonly searchInput = signal<string>('');
  readonly isScrolled = signal<boolean>(false);
  readonly favoritesCount = signal<number>(0);

  readonly isLoadingCategories = signal<boolean>(true);
  readonly dynamicCategories = signal<Category[]>([]);

  readonly cartCount = computed(() => this.cartService.itemCount());

  private hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly currentUrl = signal<string>('');

  constructor() {
    const destroyRef = inject(DestroyRef);

    this.currentUrl.set(this.router.url);
    this.updateActiveLink(this.router.url);
    this.syncSearchFromUrl(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef)
      )
      .subscribe((event) => {
        const url = event.urlAfterRedirects;
        this.currentUrl.set(url);
        this.updateActiveLink(url);
        this.syncSearchFromUrl(url);
        this.refreshFavoritesCount();
        this.cartService.refreshFromStorage();
      });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.updateActiveLink(this.router.url);
    this.syncSearchFromUrl(this.router.url);
    this.refreshFavoritesCount();
    this.cartService.refreshFromStorage();
  }

  categoryRoute(category: Category): string[] {
    return [NAV_ROUTES.categoryDetail(category.id)];
  }

  @HostListener('document:click', [])
  onDocumentClick(): void {
    this.closeAllFloatingDropdowns();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isScrolled.set(window.scrollY > 40);
  }

  @HostListener('document:keydown.escape', [])
  onEscapePressed(): void {
    this.closeAllFloatingDropdowns();
    this.isMegaMenuOpen.set(false);
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
      this.activeMainLink.set('Rooms');
    } else if (path.startsWith('/inspirations')) {
      this.activeMainLink.set('Inspirations');
    } else if (path.startsWith('/offers')) {
      this.activeMainLink.set('Offers & promotions');
    } else {
      this.activeMainLink.set('');
    }
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          const mapped: Category[] = cats.map((c) => ({
            id: String(c.id),
            nameEn: c.nameEn,
            nameAr: c.nameAr,
            imageUrl: c.imageUrl,
            icon: this.getIconForCategory(c.nameEn),
            svgPath: this.getSvgPathForCategory(c.nameEn),
          }));
          this.dynamicCategories.set(mapped);
        } else {
          this.dynamicCategories.set(Constants.CATEGORIES);
        }
        this.isLoadingCategories.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch dynamic categories. Falling back to static assets.', err);
        this.dynamicCategories.set(Constants.CATEGORIES);
        this.isLoadingCategories.set(false);
      },
    });
  }

  onMouseEnter(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.isMegaMenuOpen.set(true);
  }

  onMouseLeave(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }
    this.hoverTimeout = setTimeout(() => {
      this.isMegaMenuOpen.set(false);
    }, 200);
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((prev) => !prev);
    if (this.isMobileMenuOpen()) {
      this.closeAllFloatingDropdowns();
    }
  }

  toggleMegaMenu(forceState?: boolean): void {
    if (forceState !== undefined) {
      this.isMegaMenuOpen.set(forceState);
    } else {
      this.isMegaMenuOpen.update((prev) => !prev);
    }
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.isLanguageDropdownOpen.update((prev) => !prev);
    this.isCurrencyDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
  }

  toggleCurrencyDropdown(event: Event): void {
    event.stopPropagation();
    this.isCurrencyDropdownOpen.update((prev) => !prev);
    this.isLanguageDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
  }

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.isProfileDropdownOpen.update((prev) => !prev);
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
  }

  selectLanguage(lang: LanguageOption): void {
    this.selectedLanguage.set(lang);
    this.isLanguageDropdownOpen.set(false);
    this.translationService.setLanguage(lang.code);
    this.languageChange.emit(lang);
  }

  selectCurrency(curr: CurrencyOption): void {
    this.selectedCurrency.set(curr);
    this.isCurrencyDropdownOpen.set(false);
    this.currencyChange.emit(curr);
  }

  toggleMobileAccordion(section: string): void {
    this.activeMobileAccordion.update((curr) => (curr === section ? null : section));
  }

  selectMainLink(link: string): void {
    this.activeMainLink.set(link);
    this.mainLinkClick.emit(link);
    if (link === 'Products') {
      this.toggleMegaMenu(true);
    } else {
      this.toggleMegaMenu(false);
      this.isMobileMenuOpen.set(false);
    }
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchInput.set(value);
    this.searchChange.emit(value);
  }

  submitSearch(event?: Event): void {
    event?.preventDefault();
    const query = this.searchInput().trim();
    if (!query) return;

    this.isMobileMenuOpen.set(false);
    void this.router.navigate([NAV_ROUTES.SEARCH], { queryParams: { q: query } });
  }

  onCategorySelect(cat: Category): void {
    this.categoryClick.emit(cat);
    this.isMegaMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
  }

  onPromoSelect(banner: PromoBanner): void {
    this.promoClick.emit(banner);
  }

  onLogout(): void {
    this.authService.logout();
    this.isProfileDropdownOpen.set(false);
    void this.router.navigate([NAV_ROUTES.LOGIN]);
  }

  closeAllDropdowns(): void {
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
  }

  closeAllFloatingDropdowns(): void {
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
  }

  private syncSearchFromUrl(url: string): void {
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) return;

    const params = new URLSearchParams(url.slice(queryIndex + 1));
    const q = params.get('q');
    if (q !== null) {
      this.searchInput.set(q);
    }
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

  private getIconForCategory(name: string): string {
    const term = name.toLowerCase();
    if (term.includes('sofa') || term.includes('couch')) return 'bi bi-couch';
    if (term.includes('wardrobe') || term.includes('closet')) return 'bi bi-door-closed';
    if (term.includes('chair') || term.includes('stool')) return 'bi bi-chair';
    if (term.includes('desk') || term.includes('table')) return 'bi bi-laptop';
    if (term.includes('cabinet') || term.includes('drawer')) return 'bi bi-archive';
    if (term.includes('office')) return 'bi bi-briefcase';
    return 'bi bi-tag';
  }

  private getSvgPathForCategory(name: string): string {
    const term = name.toLowerCase();
    const match = Constants.CATEGORIES.find(
      (c) => c.nameEn.toLowerCase().includes(term) || term.includes(c.nameEn.toLowerCase())
    );
    return match?.svgPath || '';
  }
}
