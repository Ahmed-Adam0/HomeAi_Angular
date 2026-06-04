import {
  Component,
  HostListener,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

import { NAV_ROUTES } from '../../../core/constants/app-routes';
import * as NavbarConstants from '../../../core/constants/navbar.constants';
import * as FooterConstants from '../../../core/constants/footer.constants';
import { CategoryService } from '../../../features/categories/services/category.service';
import { Category } from '../../interfaces/navbar.interfaces';
import {
  FooterColumn,
  FooterTagline,
  PaymentBrand,
  SocialLink,
} from '../../interfaces/footer.interfaces';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { localized } from '../../../shared/utils/localized';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class Footer implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly translationService = inject(TranslationService);
  protected readonly navRoutes = NAV_ROUTES;

  readonly tagline = input<FooterTagline>(FooterConstants.FOOTER_TAGLINE);
  readonly linkColumns = input<FooterColumn[]>(FooterConstants.FOOTER_LINK_COLUMNS);
  readonly socialLinks = input<SocialLink[]>(FooterConstants.SOCIAL_LINKS);
  readonly paymentBrands = input<PaymentBrand[]>(FooterConstants.PAYMENT_BRANDS);
  readonly categoryItems = input<Category[]>(NavbarConstants.CATEGORIES);

  readonly footerCategories = signal<Category[]>(NavbarConstants.CATEGORIES);
  readonly isLoadingCategories = signal(false);
  readonly showScrollTop = signal(false);

  readonly copyrightYear = computed(() => new Date().getFullYear());

  ngOnInit(): void {
    this.loadCategories();
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.showScrollTop.set(window.scrollY > 400);
  }

  categoryRoute(category: Category): string[] {
    return [NAV_ROUTES.categoryDetail(category.id)];
  }

  labelForCategory(category: Category): string {
    return localized(category, 'name', this.translationService.currentLang());
  }

  labelForLink(link: { labelEn: string; labelAr: string }): string {
    return localized(link, 'label', this.translationService.currentLang());
  }

  columnTitle(column: FooterColumn): string {
    return localized(column, 'title', this.translationService.currentLang());
  }

  socialLabel(social: SocialLink): string {
    return localized(social, 'label', this.translationService.currentLang());
  }

  taglineLine1(): string {
    return localized(this.tagline(), 'line1', this.translationService.currentLang());
  }

  taglineLine2(): string {
    return localized(this.tagline(), 'line2', this.translationService.currentLang());
  }

  scrollToTop(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadCategories(): void {
    this.isLoadingCategories.set(true);
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        if (cats?.length) {
          this.footerCategories.set(
            cats.map((c) => ({
              id: String(c.id),
              nameEn: c.nameEn,
              nameAr: c.nameAr,
              imageUrl: c.imageUrl,
              icon: this.resolveIcon(c.nameEn),
              svgPath: this.resolveSvgPath(c.nameEn),
            }))
          );
        } else {
          this.footerCategories.set(this.categoryItems());
        }
        this.isLoadingCategories.set(false);
      },
      error: () => {
        this.footerCategories.set(this.categoryItems());
        this.isLoadingCategories.set(false);
      },
    });
  }

  private resolveIcon(name: string): string {
    const term = name.toLowerCase();
    if (term.includes('sofa') || term.includes('couch')) return 'bi bi-couch';
    if (term.includes('wardrobe') || term.includes('closet')) return 'bi bi-door-closed';
    if (term.includes('chair') || term.includes('stool')) return 'bi bi-chair';
    if (term.includes('desk')) return 'bi bi-laptop';
    if (term.includes('table')) return 'bi bi-border-top';
    if (term.includes('cabinet') || term.includes('drawer')) return 'bi bi-archive';
    if (term.includes('office')) return 'bi bi-briefcase';
    if (term.includes('light')) return 'bi bi-lightbulb';
    return 'bi bi-tag';
  }

  private resolveSvgPath(name: string): string {
    const term = name.toLowerCase();
    const match = NavbarConstants.CATEGORIES.find(
      (c) =>
        c.nameEn.toLowerCase().includes(term) ||
        term.includes(c.nameEn.toLowerCase())
    );
    return match?.svgPath ?? '';
  }
}
