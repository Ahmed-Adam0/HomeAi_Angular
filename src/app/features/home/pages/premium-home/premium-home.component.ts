import { Component, ElementRef, inject, PLATFORM_ID, AfterViewInit, OnDestroy, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CategoryService } from '../../../categories/services/category.service';
import { ICategory } from '../../../categories/interfaces/icategory';
import { ProductService } from '../../../products/services/product.service';
import { IProduct } from '../../../products/interfaces/iproduct';
import { CartService } from '../../../cart/services/cart.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { UiState } from '../../../../core/state/ui.state';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-premium-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './premium-home.component.html',
  styleUrl: './premium-home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PremiumHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly translationService = inject(TranslationService);
  private router = inject(Router);
  private categoryService = inject(CategoryService);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  private uiState = inject(UiState);
  private el = inject(ElementRef);
  private platformId = inject(PLATFORM_ID);

  readonly categories = signal<ICategory[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  private categoriesSub?: Subscription;

  readonly allProducts = signal<IProduct[]>([]);
  readonly activeCategoryId = signal<number | null>(null);
  readonly filteredProducts = computed(() => {
    const all = this.allProducts();
    const catId = this.activeCategoryId();
    const filtered = catId === null ? all : all.filter(p => p.categoryId === catId);
    return filtered.slice(0, 3);
  });
  readonly isProductsLoading = signal(true);
  readonly productsError = signal<string | null>(null);
  readonly addingProductId = signal<number | null>(null);
  readonly cartSuccessId = signal<number | null>(null);
  readonly togglingFavoriteId = signal<number | null>(null);
  private productsSub?: Subscription;
  private filterInProgress = false;
  private scrollRevealInitialized = false;
  private parallaxInitialized = false;

  private heroTimeline?: gsap.core.Timeline;
  private scrollTriggers: ScrollTrigger[] = [];

  ngOnInit(): void {
    this.loadCategories();
    this.loadProducts();
    if (isPlatformBrowser(this.platformId)) {
      this.favoritesService.getFavorites().subscribe();
    }
  }

  private loadCategories(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.categoriesSub = this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message || 'Failed to load categories');
        this.isLoading.set(false);
      }
    });
  }

  private loadProducts(): void {
    this.isProductsLoading.set(true);
    this.productsError.set(null);
    this.productsSub = this.productService.getProducts({ page: 1, limit: 50 }).subscribe({
      next: (data) => {
        this.allProducts.set(data || []);
        this.isProductsLoading.set(false);
        requestAnimationFrame(() => {
          if (isPlatformBrowser(this.platformId)) {
            // Delay to let Angular render the newly loaded products
            requestAnimationFrame(() => {
              this.initProductScrollReveal();
              this.initProductParallax();
            });
          }
        });
      },
      error: (err) => {
        this.productsError.set(err?.message || 'Failed to load products');
        this.isProductsLoading.set(false);
      }
    });
  }

  filterByCategory(categoryId: number | null): void {
    if (this.activeCategoryId() === categoryId || this.filterInProgress) return;
    this.filterInProgress = true;
    this.parallaxInitialized = false;
    const cards = this.qsa('.product-card');
    if (cards.length) {
      gsap.to(cards, {
        opacity: 0,
        y: -25,
        scale: 0.95,
        duration: 0.35,
        stagger: 0.03,
        ease: 'power3.in',
        onComplete: () => {
          this.activeCategoryId.set(categoryId);
          requestAnimationFrame(() => requestAnimationFrame(() => {
            const newCards = this.qsa('.product-card');
            if (newCards.length) {
              gsap.fromTo(newCards,
                { y: 50, opacity: 0, scale: 0.92 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.06, ease: 'power4.out' }
              );
            }
            this.initProductParallax();
            this.filterInProgress = false;
          }));
        }
      });
    } else {
      this.activeCategoryId.set(categoryId);
      this.filterInProgress = false;
    }
  }


  openProduct(productId: number): void {
    this.router.navigate(['/products', productId]);
  }

  isTogglingFav(productId: number): boolean {
    return this.togglingFavoriteId() === productId;
  }

  isFavorite(productId: number): boolean {
    return this.favoritesService.isFavorited(productId);
  }

  toggleFavorite(event: Event, productId: number): void {
    event.stopPropagation();
    if (this.togglingFavoriteId() === productId) return;

    const wasFavorite = this.favoritesService.isFavorited(productId);
    this.togglingFavoriteId.set(productId);

    const request$ = wasFavorite
      ? this.favoritesService.removeFavorite(productId)
      : this.favoritesService.addFavorite(productId);

    request$.subscribe({
      next: () => {
        this.togglingFavoriteId.set(null);
        this.uiState.showAlert(
          'success',
          wasFavorite
            ? this.translate('FAV_REMOVED', 'Removed from favorites', 'تمت الإزالة من المفضلة')
            : this.translate('FAV_ADDED', 'Added to favorites', 'تمت الإضافة إلى المفضلة'),
          { label: this.translate('VIEW_FAV', 'View Favorites', 'عرض المفضلة'), routerLink: '/favorites' },
        );
      },
      error: () => {
        this.togglingFavoriteId.set(null);
        this.uiState.showAlert(
          'danger',
          this.translate('FAV_ERROR', 'Failed to update favorite', 'فشل تحديث المفضلة'),
        );
      },
    });
  }

  isAddingToCart(productId: number): boolean {
    return this.addingProductId() === productId;
  }

  isCartSuccess(productId: number): boolean {
    return this.cartSuccessId() === productId;
  }

  addToCart(event: Event, product: IProduct): void {
    event.stopPropagation();
    const id = product.id;
    if (this.isAddingToCart(id)) return;
    this.addingProductId.set(id);
    this.cartService.addToCart(product, 1).then(() => {
      this.cartSuccessId.set(id);
      this.addingProductId.set(null);
      this.uiState.showAlert(
        'success',
        this.translate('CART_ADDED', 'Added to Cart Successfully', 'تمت الإضافة إلى السلة بنجاح'),
        { label: this.translate('VIEW_CART', 'View Cart', 'عرض السلة'), routerLink: '/cart' },
      );
      setTimeout(() => {
        if (this.cartSuccessId() === id) {
          this.cartSuccessId.set(null);
        }
      }, 2000);
    }).catch(() => {
      this.addingProductId.set(null);
    });
  }

  productName(p: IProduct): string {
    return this.translationService.currentLang() === 'ar' ? p.nameAr : p.nameEn;
  }

  categoryNameById(categoryId: number): string {
    const cat = this.categories().find(c => c.id === categoryId);
    if (!cat) return '';
    return this.translationService.currentLang() === 'ar' ? cat.nameAr : cat.nameEn;
  }

  formatPrice(price: number): string {
    return 'EGP ' + price.toLocaleString();
  }

  getCardClass(index: number, total: number): string {
    if (total === 0) return '';
    if (total === 1) return 'category-card-tall category-card-wide';
    if (index === 0) return 'category-card-tall';
    if (index === 1) return 'category-card-wide';
    return (index - 2) % 2 === 0 ? 'category-card-square' : 'category-card-small';
  }

  categoryName(cat: ICategory): string {
    return this.translationService.currentLang() === 'ar' ? cat.nameAr : cat.nameEn;
  }

  trackByCategoryId(_index: number, cat: ICategory): number {
    return cat.id;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    gsap.registerPlugin(ScrollTrigger);
    this.initHeroAnimations();
    this.initEditorialAnimations();
    this.initScrollStorytelling();
    this.initCategoryAnimations();
    this.initShowcaseAnimations();
    this.initCtaAnimations();
    // Init product card animations if products already rendered; otherwise loadProducts handles it
    const hasCards = this.qsa('.product-card').length > 0;
    if (hasCards) {
      this.initProductScrollReveal();
      this.initProductParallax();
    }
  }

  ngOnDestroy(): void {
    this.categoriesSub?.unsubscribe();
    this.productsSub?.unsubscribe();
    this.heroTimeline?.kill();
    this.scrollTriggers.forEach(t => t.kill());
    ScrollTrigger.getAll().forEach(t => t.kill());
    // Kill any lingering GSAP tweens on product elements
    const productEls = this.el.nativeElement.querySelectorAll('.product-card, .product-card-img');
    productEls.forEach((el: Element) => gsap.killTweensOf(el));
  }

  translate(key: string, fallbackEn: string, fallbackAr: string): string {
    const val = this.translationService.translate(key);
    if (val === key) {
      return this.translationService.currentLang() === 'ar' ? fallbackAr : fallbackEn;
    }
    return val;
  }

  private qs(sel: string, parent?: Element): HTMLElement | null {
    return (parent || this.el.nativeElement).querySelector(sel);
  }

  private qsa(sel: string, parent?: Element): NodeListOf<HTMLElement> {
    return (parent || this.el.nativeElement).querySelectorAll(sel);
  }

  private initHeroAnimations(): void {
    const hero = this.qs('.premium-hero');
    if (!hero) return;

    const bg = this.qs('.hero-bg-image');
    const headline = this.qs('.hero-headline');
    const subheadline = this.qs('.hero-subheadline');
    const ctaGroup = this.qs('.hero-cta-group');
    const floatingBadges = this.qsa('.hero-floating-badge');
    const statsBar = this.qs('.hero-stats-bar');
    const scrollIndicator = this.qs('.hero-scroll-indicator');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.set(hero, { clearProps: 'opacity' });

    if (bg) {
      tl.fromTo(bg, { scale: 1.08, filter: 'brightness(0.6)' }, { scale: 1, filter: 'brightness(1)', duration: 2.2 }, 0);
    }

    const words = headline?.querySelectorAll('.hero-word');
    if (words?.length) {
      tl.fromTo(words, { y: 80, opacity: 0, rotateX: -15 }, { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.12, ease: 'power4.out' }, 0.3);
    }

    if (subheadline) {
      tl.fromTo(subheadline, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 0.9);
    }

    if (ctaGroup) {
      const btns = ctaGroup.querySelectorAll('.hero-cta');
      tl.fromTo(btns, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15 }, 1.2);
    }

    if (floatingBadges?.length) {
      tl.fromTo(floatingBadges, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 1, stagger: 0.2, ease: 'back.out(1.7)' }, 0.6);
    }

    if (statsBar) {
      tl.fromTo(statsBar, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, 1.6);
    }

    if (scrollIndicator) {
      tl.fromTo(scrollIndicator, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 2.2);
    }

    this.heroTimeline = tl;

    const heroParallax = this.qs('.hero-parallax-layer');
    if (heroParallax) {
      this.scrollTriggers.push(ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: 'bottom top',
        scrub: 1.5,
        onUpdate: (self) => {
          const p = self.progress;
          if (bg) {
            gsap.set(bg, { scale: 1 + p * 0.04, filter: `brightness(${1 - p * 0.15})` });
          }
          if (heroParallax) {
            gsap.set(heroParallax, { y: p * 80 });
          }
        }
      }));
    }
  }

  private initEditorialAnimations(): void {
    const section = this.qs('.editorial-section');
    if (!section) return;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 85%',
      onEnter: () => {
        const image = this.qs('.editorial-image-reveal');
        if (image) {
          gsap.fromTo(image, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 1.4, ease: 'power4.inOut' });
        }
        const content = this.qs('.editorial-content');
        if (content) {
          const children = content.children;
          gsap.fromTo(children, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' });
        }
      },
      once: true
    });

    const card = this.qs('.editorial-card');
    if (card) {
      this.scrollTriggers.push(ScrollTrigger.create({
        trigger: section,
        start: 'top 70%',
        end: 'bottom 30%',
        scrub: 1,
        onUpdate: (self) => {
          gsap.set(card, { y: self.progress * -30 });
        }
      }));
    }
  }

  private initScrollStorytelling(): void {
    const section = this.qs('.scroll-storytelling');
    if (!section) return;

    const panels = this.qsa('.story-panel');
    if (!panels.length) return;

    const pin = this.qs('.story-pin-container');
    if (!pin) return;

    ScrollTrigger.create({
      trigger: section,
      pin: pin,
      start: 'top top',
      end: `+=${panels.length * 150}%`,
      scrub: 1.5,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const totalProgress = self.progress;
        const panelIndex = Math.min(Math.floor(totalProgress * panels.length), panels.length - 1);
        const panelProgress = (totalProgress * panels.length) % 1;

        panels.forEach((panel, i) => {
          const isActive = i === panelIndex;
          const isNext = i === panelIndex + 1 && i < panels.length;

          if (isActive) {
            const opacity = 1 - panelProgress * 0.35;
            const scale = 1 - panelProgress * 0.03;
            gsap.set(panel, { opacity, scale, y: panelProgress * -20, pointerEvents: 'auto' as const });
          } else if (isNext) {
            const opacity = panelProgress * 0.8;
            const scale = 0.97 + panelProgress * 0.03;
            gsap.set(panel, { opacity, scale, y: (1 - panelProgress) * 30, pointerEvents: 'none' as const });
          } else {
            gsap.set(panel, { opacity: 0, scale: 0.95, y: 0, pointerEvents: 'none' as const });
          }
        });

        const progressBar = this.qs('.story-progress');
        if (progressBar) {
          gsap.set(progressBar, { scaleX: totalProgress });
        }
      }
    });

    const bgLayers = this.qsa('.story-bg-layer');
    bgLayers.forEach((layer, i) => {
      this.scrollTriggers.push(ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
        onUpdate: (self) => {
          gsap.set(layer, { y: self.progress * (i + 1) * -40, scale: 1 + self.progress * 0.05 * (i + 1) });
        }
      }));
    });
  }

  private initCategoryAnimations(): void {
    const section = this.qs('.categories-section');
    if (!section) return;

    const items = this.qsa('.category-card');
    if (!items.length) return;

    const grid = this.qs('.category-masonry');
    if (grid) {
      imagesLoaded(grid, () => {
        ScrollTrigger.refresh();
      });
    }

    const sectionParallax = this.qs('.categories-parallax');
    if (sectionParallax) {
      this.scrollTriggers.push(ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
        onUpdate: (self) => {
          gsap.set(sectionParallax, { y: self.progress * -60 });
        }
      }));
    }

    const headers = this.qsa('.categories-header > *');
    gsap.fromTo(headers, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power4.out', scrollTrigger: { trigger: section, start: 'top 80%', once: true } });

    items.forEach((item, i) => {
      ScrollTrigger.create({
        trigger: item,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          gsap.fromTo(item,
            { y: 100, opacity: 0, scale: 0.92, rotateX: 8 },
            { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 1.2, delay: i * 0.12, ease: 'power4.out' }
          );
        }
      });

      this.scrollTriggers.push(ScrollTrigger.create({
        trigger: item,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          const img = item.querySelector('.category-card-img') as HTMLElement;
          if (img) gsap.set(img, { y: self.progress * -40 });
        }
      }));
    });
  }

  private initShowcaseAnimations(): void {
    const section = this.qs('.showcase-section');
    if (!section) return;

    const sectionTag = this.qs('.products-tag');
    const heading = this.qs('.products-heading');
    const subtitle = this.qs('.products-subtitle');
    const pillsContainer = this.qs('.products-pills');
    const viewAll = this.qs('.products-view-all');

    // Parallax on section background (keep existing)
    this.scrollTriggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5,
      onUpdate: (self) => {
        const bg = this.qs('.showcase-bg') as HTMLElement;
        if (bg) gsap.set(bg, { y: self.progress * -40 });
      }
    }));

    // --- Main section entrance timeline ---
    const entranceTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 82%',
        once: true
      }
    });

    // 1. Section tag (if exists)
    if (sectionTag) {
      entranceTl.fromTo(sectionTag,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    // 2. Title — split into words with mask reveal
    if (heading) {
      const text = heading.textContent?.trim() || '';
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length > 0) {
        heading.innerHTML = '';
        words.forEach((word, i) => {
          const span = document.createElement('span');
          span.className = 'product-heading-word';
          span.textContent = word;
          if (i < words.length - 1) {
            span.style.marginRight = '0.25em';
          }
          heading.appendChild(span);
        });
        const wordSpans = heading.querySelectorAll('.product-heading-word');
        entranceTl.fromTo(wordSpans,
          { y: 60, opacity: 0, rotateX: -12 },
          { y: 0, opacity: 1, rotateX: 0, duration: 1, stagger: 0.12, ease: 'power4.out' },
          sectionTag ? '+=0.1' : 0
        );
      }
    }

    // 3. Subtitle — fade up with blur-to-sharp
    if (subtitle) {
      entranceTl.fromTo(subtitle,
        { y: 30, opacity: 0, filter: 'blur(4px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out' },
        '+=0.15'
      );
    }

    // 4. Category pills — stagger from left to right
    const pills = pillsContainer?.querySelectorAll('.pill-btn');
    if (pills?.length) {
      entranceTl.fromTo(pills,
        { x: -25, opacity: 0, scale: 0.9 },
        { x: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.04, ease: 'power3.out' },
        '+=0.15'
      );
    }

    // 5. View All button — entrance when it reaches the bottom
    if (viewAll) {
      ScrollTrigger.create({
        trigger: viewAll,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          gsap.fromTo(viewAll,
            { y: 30, opacity: 0, scale: 0.95 },
            { y: 0, opacity: 1, scale: 1, duration: 1, ease: 'power4.out' }
          );
        }
      });
    }
  }

  private getProductsPerRow(): number {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  private initProductScrollReveal(): void {
    if (this.scrollRevealInitialized) return;
    this.scrollRevealInitialized = true;
    const cards = this.qsa('.product-card');
    if (!cards.length) return;

    const perRow = this.getProductsPerRow();
    const totalRows = Math.ceil(cards.length / perRow);

    // Set all cards invisible initially
    gsap.set(cards, { opacity: 0, y: 50, scale: 0.92 });

    // Build a timeline that reveals one row at a time
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.products-grid',
        start: 'top 82%',
        once: true
      }
    });

    for (let r = 0; r < totalRows; r++) {
      const from = r * perRow;
      const to = Math.min(from + perRow, cards.length);
      const rowCards = Array.from(cards).slice(from, to);
      const label = r === 0 ? 0 : '+=0.3';
      tl.fromTo(rowCards,
        { y: 50, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.9, stagger: 0.08, ease: 'power4.out' },
        label
      );
    }
  }

  private initProductParallax(): void {
    if (this.parallaxInitialized) return;
    this.parallaxInitialized = true;
    const cards = this.qsa('.product-card');
    cards.forEach((card) => {
      const img = card.querySelector('.product-card-img') as HTMLElement;
      if (!img) return;
      this.scrollTriggers.push(ScrollTrigger.create({
        trigger: card,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          gsap.set(img, { y: self.progress * -20 });
        }
      }));
    });
  }

  private initCtaAnimations(): void {
    const section = this.qs('.cta-ai-section');
    if (!section) return;

    const bg = this.qs('.cta-bg');
    if (bg) {
      gsap.to(bg, {
        scale: 1.06,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
      });
    }

    const overlay = this.qs('.cta-overlay');
    if (overlay) {
      gsap.to(overlay, { opacity: 0.6, duration: 6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    }

    const floatingEls = this.qsa('.cta-floating');
    floatingEls.forEach((el, i) => {
      gsap.to(el, {
        y: i % 2 === 0 ? -25 : 25,
        x: i % 3 === 0 ? 15 : -15,
        rotation: i % 2 === 0 ? 5 : -5,
        duration: 5 + i * 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: i * 0.4
      });
    });

    const particles = this.qsa('.cta-particle');
    particles.forEach((p, i) => {
      gsap.set(p, { scale: 0, opacity: 0 });
      gsap.to(p, {
        scale: 1 + Math.random() * 0.5,
        opacity: 0.3 + Math.random() * 0.3,
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        duration: 3 + Math.random() * 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: i * 0.2
      });
    });

    const counter = this.qs('.cta-counter');
    if (counter) {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          const obj = { val: 0 };
          gsap.to(obj, {
            val: 100,
            duration: 3,
            ease: 'power2.out',
            onUpdate: () => {
              counter.textContent = Math.round(obj.val) + '%';
            }
          });
        }
      });
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        const badge = this.qs('.cta-badge');
        if (badge) {
          gsap.fromTo(badge, { y: 30, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });
        }
        const headline = this.qs('.cta-headline');
        if (headline) {
          gsap.fromTo(headline, { y: 70, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 1.4, ease: 'power4.out' });
        }
        const desc = this.qs('.cta-description');
        if (desc) {
          gsap.fromTo(desc, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.3, ease: 'power3.out' });
        }
        const stats = this.qsa('.cta-stat-item');
        gsap.fromTo(stats, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.12, delay: 0.5, ease: 'power3.out' });
        const btn = this.qs('.cta-btn');
        if (btn) {
          gsap.fromTo(btn, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, delay: 0.7, ease: 'power3.out' });
        }
      }
    });

    this.scrollTriggers.push(ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.5,
      onUpdate: (self) => {
        if (bg) gsap.set(bg, { scale: 1 + self.progress * 0.04 });
      }
    }));
  }

  private initGlobalRevealAnimations(): void {
    const reveals = this.qsa('.reveal-on-scroll');
    reveals.forEach(el => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          gsap.fromTo(el, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' });
        }
      });
    });
  }
}

function imagesLoaded(grid: Element, callback: () => void): void {
  const imgs = grid.querySelectorAll('img');
  let loaded = 0;
  if (!imgs.length) { callback(); return; }
  imgs.forEach(img => {
    if (img.complete) {
      loaded++;
      if (loaded === imgs.length) callback();
    } else {
      img.addEventListener('load', () => {
        loaded++;
        if (loaded === imgs.length) callback();
      });
      img.addEventListener('error', () => {
        loaded++;
        if (loaded === imgs.length) callback();
      });
    }
  });
}
