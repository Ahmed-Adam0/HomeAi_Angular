import { Component, inject, signal, input, model, output, PLATFORM_ID, OnInit, HostListener, DestroyRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageOption, CurrencyOption, Category, MegaMenuColumn, PromoBanner, NavLink } from '../../../shared/interfaces/navbar.interfaces';
import * as Constants from '../../../core/constants/navbar.constants';
import { AuthService } from '../../../features/auth/services/auth.service';
import { NotificationService } from '../../../features/notifications/services/notification.service';
import { CategoryService } from '../../../features/categories/services/category.service';
import { SkeletonLoader } from '../skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, SkeletonLoader],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class Navbar implements OnInit {
  // Injection Services
  protected translationService = inject(TranslationService);
  protected authService = inject(AuthService);
  protected notificationService = inject(NotificationService);
  protected categoryService = inject(CategoryService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  // CONFIGURABLE INPUT SIGNALS (Dumb Component Inputs with Defaults)
  readonly wishlistCount = input<number>(2);
  readonly cartCount = input<number>(3);

  readonly languages = input<LanguageOption[]>(Constants.LANGUAGES);
  readonly currencies = input<CurrencyOption[]>(Constants.CURRENCIES);
  readonly mainNavLinks = input<NavLink[]>(Constants.MAIN_NAV_LINKS);
  readonly categoryItems = input<Category[]>(Constants.CATEGORIES);
  readonly megaMenuColumns = input<MegaMenuColumn[]>(Constants.MEGA_MENU_COLUMNS);
  readonly promoBanner = input<PromoBanner>(Constants.PROMO_BANNER);

  // MODELS (Two-Way Bindings)
  readonly activeMainLink = model<string>('Inspirations');
  readonly selectedLanguage = model<LanguageOption>(Constants.LANGUAGES[0]);
  readonly selectedCurrency = model<CurrencyOption>(Constants.CURRENCIES[0]);

  // OUTPUT EMITTERS (Dumb Component Events)
  readonly languageChange = output<LanguageOption>();
  readonly currencyChange = output<CurrencyOption>();
  readonly searchChange = output<string>();
  readonly mainLinkClick = output<string>();
  readonly categoryClick = output<Category>();
  readonly wishlistClick = output<void>();
  readonly cartClick = output<void>();
  readonly profileClick = output<void>();
  readonly promoClick = output<PromoBanner>();

  // LOCAL UI STATE SIGNALS (Internal View State Only)
  readonly isMobileMenuOpen = signal<boolean>(false);
  readonly isMegaMenuOpen = signal<boolean>(false);
  readonly isLanguageDropdownOpen = signal<boolean>(false);
  readonly isCurrencyDropdownOpen = signal<boolean>(false);
  readonly isProfileDropdownOpen = signal<boolean>(false);
  readonly isNotificationsDropdownOpen = signal<boolean>(false);
  readonly activeMobileAccordion = signal<string | null>(null);
  readonly searchInput = signal<string>('');
  readonly isScrolled = signal<boolean>(false);

  // DYNAMIC CATEGORIES API STATE
  readonly isLoadingCategories = signal<boolean>(true);
  readonly dynamicCategories = signal<Category[]>([]);

  // Hover Delay Timeout Management
  private hoverTimeout: any;

  readonly currentUrl = signal<string>('');

  constructor() {
    const destroyRef = inject(DestroyRef);
    
    // Set initial URL
    this.currentUrl.set(this.router.url);
    this.updateActiveLink(this.router.url);

    // Listen to routing events
    this.router.events.pipe(
      takeUntilDestroyed(destroyRef)
    ).subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        this.currentUrl.set(url);
        this.updateActiveLink(url);
      }
    });
  }

  updateActiveLink(url: string): void {
    const path = url.split('?')[0];
    if (path === '/products' || path.startsWith('/categories/') || path === '/search') {
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

  ngOnInit(): void {
    this.loadCategories();
    this.updateActiveLink(this.router.url);
  }

  // Document click listener to close floating dropdowns automatically when clicking outside
  @HostListener('document:click', [])
  onDocumentClick(): void {
    this.closeAllFloatingDropdowns();
  }

  // Window scroll event listener to trigger sticky compression & glassmorphism styling
  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.isScrolled.set(window.scrollY > 40);
  }

  // Keyboard accessibility helper to close all open elements on Escape press
  @HostListener('document:keydown.escape', [])
  onEscapePressed(): void {
    this.closeAllFloatingDropdowns();
    this.isMegaMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
  }

  loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        if (cats && cats.length > 0) {
          // Map dynamic categories (ICategory) to our Category format
          const mapped: Category[] = cats.map(c => ({
            id: String(c.id),
            nameEn: c.nameEn,
            nameAr: c.nameAr,
            imageUrl: c.imageUrl,
            icon: this.getIconForCategory(c.nameEn),
            svgPath: this.getSvgPathForCategory(c.nameEn)
          }));
          this.dynamicCategories.set(mapped);
        } else {
          // Fallback to local constants if API is empty
          this.dynamicCategories.set(Constants.CATEGORIES);
        }
        this.isLoadingCategories.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch dynamic categories. Falling back to static assets.', err);
        this.dynamicCategories.set(Constants.CATEGORIES);
        this.isLoadingCategories.set(false);
      }
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
    }, 200); // 200ms delay to allow cursor transitions without flickering
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(prev => !prev);
    if (this.isMobileMenuOpen()) {
      this.closeAllFloatingDropdowns();
    }
  }

  toggleMegaMenu(forceState?: boolean): void {
    if (forceState !== undefined) {
      this.isMegaMenuOpen.set(forceState);
    } else {
      this.isMegaMenuOpen.update(prev => !prev);
    }
  }

  toggleLanguageDropdown(event: Event): void {
    event.stopPropagation();
    this.isLanguageDropdownOpen.update(prev => !prev);
    this.isCurrencyDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
    this.isNotificationsDropdownOpen.set(false);
  }

  toggleCurrencyDropdown(event: Event): void {
    event.stopPropagation();
    this.isCurrencyDropdownOpen.update(prev => !prev);
    this.isLanguageDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
    this.isNotificationsDropdownOpen.set(false);
  }

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.isProfileDropdownOpen.update(prev => !prev);
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
    this.isNotificationsDropdownOpen.set(false);
  }

  toggleNotificationsDropdown(event: Event): void {
    event.stopPropagation();
    this.isNotificationsDropdownOpen.update(prev => !prev);
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
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
    this.activeMobileAccordion.update(curr => curr === section ? null : section);
  }

  selectMainLink(link: string): void {
    this.activeMainLink.set(link);
    this.mainLinkClick.emit(link);
    if (link === 'Products') {
      this.toggleMegaMenu(true);
    } else {
      this.toggleMegaMenu(false);
    }
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchInput.set(input.value);
    this.searchChange.emit(input.value);
  }

  onCategorySelect(cat: Category): void {
    this.categoryClick.emit(cat);
  }

  onPromoSelect(banner: PromoBanner): void {
    this.promoClick.emit(banner);
  }

  onWishlistSelect(): void {
    this.wishlistClick.emit();
  }

  onCartSelect(): void {
    this.cartClick.emit();
  }

  onProfileSelect(): void {
    this.profileClick.emit();
  }

  onLogout(): void {
    this.authService.logout();
    this.isProfileDropdownOpen.set(false);
    this.router.navigate(['/auth/login']);
  }

  markNotificationAsRead(id: string, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id);
  }

  clearAllNotifications(event: Event): void {
    event.stopPropagation();
    this.notificationService.clearAll();
  }

  closeAllDropdowns(): void {
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
  }

  closeAllFloatingDropdowns(): void {
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
    this.isProfileDropdownOpen.set(false);
    this.isNotificationsDropdownOpen.set(false);
  }

  // Utility category styling helpers
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
      c => c.nameEn.toLowerCase().includes(term) || term.includes(c.nameEn.toLowerCase())
    );
    return match?.svgPath || '';
  }
}
