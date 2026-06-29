import { Component, OnInit, OnDestroy, inject, signal, computed, PLATFORM_ID, HostListener } from '@angular/core';
import { NgIf, NgFor, NgClass, NgStyle, isPlatformBrowser } from '@angular/common';
import { ShowcaseService, ShowcaseSlide, ShowcaseHotspot } from '../../services/showcase.service';
import { ProductService } from '../../../products/services/product.service';
import { IProduct } from '../../../products/interfaces/iproduct';
import { CartService } from '../../../cart/services/cart.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ShowcaseProductCardComponent } from '../showcase-product-card/showcase-product-card.component';
import { UiState } from '../../../../core/state/ui.state';

@Component({
  selector: 'app-ai-room-showcase',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgStyle, TranslatePipe, ShowcaseProductCardComponent],
  templateUrl: './ai-room-showcase.component.html',
  styleUrl: './ai-room-showcase.component.css'
})
export class AiRoomShowcaseComponent implements OnInit, OnDestroy {
  protected translationService = inject(TranslationService);
  protected cartService = inject(CartService);
  private productService = inject(ProductService);
  private showcaseService = inject(ShowcaseService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  readonly isArabic = computed(() => this.translationService.currentLang() === 'ar');
  readonly isMobile = signal<boolean>(false);
  
  // Showcase Slides and Slider State
  readonly slides = signal<ShowcaseSlide[]>([]);
  readonly currentSlideIndex = signal<number>(0);
  readonly isPlaying = signal<boolean>(true);

  // Active Hotspot & Resolved Product details
  readonly activeHotspot = signal<ShowcaseHotspot | null>(null);
  readonly activeProduct = signal<IProduct | null>(null);
  readonly isLoadingProduct = signal<boolean>(false);

  private autoplayIntervalId: any;
  private touchStartX = 0;
  private touchEndX = 0;

  ngOnInit(): void {
    this.checkScreenSize();
    this.loadSlidesAndSync();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      if (this.isArabic()) {
        this.nextSlide();
      } else {
        this.prevSlide();
      }
    } else if (event.key === 'ArrowRight') {
      if (this.isArabic()) {
        this.prevSlide();
      } else {
        this.nextSlide();
      }
    }
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile.set(window.innerWidth < 992);
    }
  }

  private loadSlidesAndSync(): void {
    this.showcaseService.getShowcaseSlides().subscribe({
      next: (showcaseSlides) => {
        this.slides.set(showcaseSlides);
        this.resolveProductIds(showcaseSlides);
        this.startAutoplay();
      },
      error: (err) => console.error('Failed to load showcase slides', err)
    });
  }

  /**
   * Resolve mockup product IDs to actual backend product IDs to guarantee
   * that clicking hotspots will successfully load products without 404 errors.
   */
  private resolveProductIds(showcaseSlides: ShowcaseSlide[]): void {
    this.productService.getProducts({ page: 1, limit: 30 } as any).subscribe({
      next: (products) => {
        if (!products || products.length === 0) return;
        
        // Dynamically assign actual product IDs to mock hotspots
        showcaseSlides.forEach((slide, sIdx) => {
          slide.hotspots.forEach((hotspot, hIdx) => {
            const index = (sIdx * 3 + hIdx) % products.length;
            hotspot.productId = products[index].id;
          });
        });
      },
      error: (err) => {
        console.warn('Could not retrieve catalog products to map showcase hotspots. Running defaults.', err);
      }
    });
  }

  // Hotspot selection flow
  onHotspotClick(hotspot: ShowcaseHotspot, event: Event): void {
    event.stopPropagation();
    
    if (this.activeHotspot() === hotspot) {
      this.closePopup();
      return;
    }

    this.activeHotspot.set(hotspot);
    this.activeProduct.set(null);
    this.isLoadingProduct.set(true);

    this.productService.getProductById(hotspot.productId).subscribe({
      next: (product) => {
        this.activeProduct.set(product);
        this.isLoadingProduct.set(false);
      },
      error: (err) => {
        console.error(`Failed to load product details for ID ${hotspot.productId}`, err);
        const isAr = this.isArabic();
        this.uiState.showAlert(
          'danger',
          isAr ? 'فشل تحميل تفاصيل المنتج.' : 'Failed to retrieve product details.'
        );
        this.closePopup();
      }
    });
  }

  closePopup(): void {
    this.activeHotspot.set(null);
    this.activeProduct.set(null);
    this.isLoadingProduct.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('mobile-drawer-sheet') || 
        (event.target as HTMLElement).classList.contains('drawer-sheet-backdrop')) {
      this.closePopup();
    }
  }

  // Slider navigation methods
  prevSlide(): void {
    this.closePopup();
    const count = this.slides().length;
    if (count === 0) return;
    this.currentSlideIndex.update((idx) => (idx - 1 + count) % count);
  }

  nextSlide(): void {
    this.closePopup();
    const count = this.slides().length;
    if (count === 0) return;
    this.currentSlideIndex.update((idx) => (idx + 1) % count);
  }

  selectSlide(index: number): void {
    this.closePopup();
    this.currentSlideIndex.set(index);
  }

  togglePlay(): void {
    this.isPlaying.update((play) => !play);
    if (this.isPlaying()) {
      this.startAutoplay();
    } else {
      this.stopAutoplay();
    }
  }

  // Autoplay controls
  startAutoplay(): void {
    this.stopAutoplay();
    if (isPlatformBrowser(this.platformId)) {
      this.autoplayIntervalId = setInterval(() => {
        if (this.isPlaying() && !this.activeHotspot()) {
          this.nextSlide();
        }
      }, 6000); // 6 seconds slide interval
    }
  }

  stopAutoplay(): void {
    if (this.autoplayIntervalId) {
      clearInterval(this.autoplayIntervalId);
      this.autoplayIntervalId = null;
    }
  }

  // Pause on hover handlers
  onMouseEnter(): void {
    if (this.isPlaying()) {
      this.stopAutoplay();
    }
  }

  onMouseLeave(): void {
    if (this.isPlaying()) {
      this.startAutoplay();
    }
  }

  // Touch Swipe gestures handlers
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe(): void {
    const swipeThreshold = 55;
    const diff = this.touchStartX - this.touchEndX;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left
        if (this.isArabic()) {
          this.prevSlide();
        } else {
          this.nextSlide();
        }
      } else {
        // Swiped right
        if (this.isArabic()) {
          this.nextSlide();
        } else {
          this.prevSlide();
        }
      }
    }
  }

  // Calculate overflow direction for floating tooltip popups
  getCardDirectionClass(x: number, y: number): string {
    const xDir = x > 50 ? 'left' : 'right';
    const yDir = y > 50 ? 'top' : 'bottom';
    return `dir-${xDir}-${yDir}`;
  }
}
