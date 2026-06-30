import { Component, OnInit, OnDestroy, inject, signal, computed, PLATFORM_ID, HostListener } from '@angular/core';
import { NgIf, NgFor, NgClass, NgStyle, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShowcaseService, ShowcaseSlide, ShowcaseHotspot, ShowcaseProduct } from '../../services/showcase.service';
import { IProduct } from '../../../products/interfaces/iproduct';
import { CartService } from '../../../cart/services/cart.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { ShowcaseProductCardComponent } from '../showcase-product-card/showcase-product-card.component';
import { UiState } from '../../../../core/state/ui.state';

@Component({
  selector: 'app-ai-room-showcase',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, NgStyle, TranslatePipe, ShowcaseProductCardComponent, RouterLink],
  templateUrl: './ai-room-showcase.component.html',
  styleUrl: './ai-room-showcase.component.css'
})
export class AiRoomShowcaseComponent implements OnInit, OnDestroy {
  protected translationService = inject(TranslationService);
  protected cartService = inject(CartService);
  private showcaseService = inject(ShowcaseService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  readonly isArabic = computed(() => this.translationService.currentLang() === 'ar');
  readonly isMobile = signal<boolean>(false);
  
  // Showcase Slides, loading/error states, and Slider State
  readonly slides = signal<ShowcaseSlide[]>([]);
  readonly currentSlideIndex = signal<number>(0);
  readonly isPlaying = signal<boolean>(true);
  readonly loading = signal<boolean>(true);
  readonly error = signal<boolean>(false);

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
    this.loading.set(true);
    this.error.set(false);
    this.showcaseService.getShowcase().subscribe({
      next: (showcaseSlides) => {
        const activeSortedSlides = (showcaseSlides || [])
          .filter(slide => slide.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        activeSortedSlides.forEach(slide => {
          if (slide.hotspots) {
            slide.hotspots = slide.hotspots
              .filter(h => h.isActive)
              .sort((a, b) => a.displayOrder - b.displayOrder);
          }
        });

        this.slides.set(activeSortedSlides);
        this.loading.set(false);
        this.startAutoplay();
      },
      error: (err) => {
        console.error('Failed to load showcase slides', err);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  private mapShowcaseProductToIProduct(showcaseProduct: ShowcaseProduct): IProduct {
    return {
      id: showcaseProduct.id,
      nameAr: showcaseProduct.nameAr || '',
      nameEn: showcaseProduct.nameEn || '',
      descriptionAr: showcaseProduct.descriptionAr || '',
      descriptionEn: showcaseProduct.descriptionEn || '',
      price: showcaseProduct.basePrice || 0,
      basePrice: showcaseProduct.basePrice || 0,
      mainImageUrl: showcaseProduct.mainImageUrl || '',
      averageRating: showcaseProduct.averageRating || 0,
      categoryId: 0,
      categoryNameAr: '',
      categoryNameEn: '',
      workshopId: 0,
      workshopNameAr: '',
      workshopNameEn: '',
      createdAt: new Date().toISOString()
    };
  }

  // Hotspot selection flow
  onHotspotClick(hotspot: ShowcaseHotspot, event: Event): void {
    event.stopPropagation();
    
    if (this.activeHotspot() === hotspot) {
      this.closePopup();
      return;
    }

    this.activeHotspot.set(hotspot);
    
    if (hotspot.product) {
      const mappedProduct = this.mapShowcaseProductToIProduct(hotspot.product);
      this.activeProduct.set(mappedProduct);
    } else {
      this.activeProduct.set(null);
    }
    
    this.isLoadingProduct.set(false);
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
