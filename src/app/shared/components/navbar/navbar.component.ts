import { Component, inject, signal, input, model, output, PLATFORM_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { LanguageOption, CurrencyOption, Category, MegaMenuColumn, PromoBanner, NavLink } from '../../../shared/interfaces/navbar.interfaces';
import * as Constants from '../../../core/constants/navbar.constants';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class Navbar {
  // Injection Services
  protected translationService = inject(TranslationService);
  private platformId = inject(PLATFORM_ID);

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
  readonly activeMobileAccordion = signal<string | null>(null);
  readonly searchInput = signal<string>('');

  // Hover Delay Timeout Management
  private hoverTimeout: any;

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
      this.isLanguageDropdownOpen.set(false);
      this.isCurrencyDropdownOpen.set(false);
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
  }

  toggleCurrencyDropdown(event: Event): void {
    event.stopPropagation();
    this.isCurrencyDropdownOpen.update(prev => !prev);
    this.isLanguageDropdownOpen.set(false);
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

  closeAllDropdowns(): void {
    this.isLanguageDropdownOpen.set(false);
    this.isCurrencyDropdownOpen.set(false);
  }
}
