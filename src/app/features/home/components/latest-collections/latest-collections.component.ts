import { Component, ElementRef, inject, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser, NgIf, NgFor } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../products/services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { IProduct } from '../../../products/interfaces/iproduct';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

export interface ILatestCollectionProduct extends IProduct {
  discount?: number;
  oldPrice?: number;
}

@Component({
  selector: 'app-latest-collections',
  standalone: true,
  imports: [NgIf, NgFor, RouterLink, CurrencyFormatPipe, TranslatePipe, LocalizedPipe, LazyImageDirective],
  templateUrl: './latest-collections.component.html',
  styleUrl: './latest-collections.component.css'
})
export class LatestCollectionsComponent implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductService);
  protected cartService = inject(CartService);
  protected favoritesService = inject(FavoritesService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  // Angular Signals for component state
  readonly products = signal<ILatestCollectionProduct[]>([]);
  readonly loading = signal<boolean>(true);
  readonly error = signal<boolean>(false);
  readonly currentSlide = signal<number>(0);
  readonly visibleCards = signal<number>(4);

  // Resize listener reference for cleanup
  private resizeListener!: () => void;

  ngOnInit(): void {
    this.fetchLatestProducts();
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.updateVisibleCards();
      this.resizeListener = () => this.updateVisibleCards();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId) && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  /**
   * Fetches latest products from the ProductService and maps them.
   */
  private fetchLatestProducts(): void {
    this.loading.set(true);
    this.error.set(false);
    
    // Request products with query parameters for newest items
    this.productService.getProducts({ page: 1, limit: 10, sortBy: 'newest' }).subscribe({
      next: (response) => {
        // Defensive checking of API wrapper properties by casting to any
        const rawResponse = response as any;
        const items = rawResponse?.data ?? rawResponse?.items ?? rawResponse?.products ?? response ?? [];
        const validItems = (Array.isArray(items) ? items : []).filter((p) => p && p.id);

        const mappedData: ILatestCollectionProduct[] = validItems.map((p) => {
          // If api returns discount or oldPrice, use them. Otherwise, check if we can safely calculate them
          const rawProd = p as any;
          const discount = rawProd.discount || (rawProd.oldPrice && rawProd.oldPrice > p.price ? Math.round(((rawProd.oldPrice - p.price) / rawProd.oldPrice) * 100) : undefined);
          const oldPrice = rawProd.oldPrice || (rawProd.discount && rawProd.discount > 0 ? Math.round(p.price / (1 - rawProd.discount / 100)) : undefined);
          
          return {
            ...p,
            discount,
            oldPrice
          };
        });
        
        console.log('Latest collections loaded', mappedData);
        this.products.set(mappedData);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load latest collections:', err);
        console.log('Latest collections loaded', []);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  /**
   * Recalculates the number of cards that should be visible based on container width.
   */
  updateVisibleCards(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    const width = window.innerWidth;
    if (width >= 1200) {
      this.visibleCards.set(5);
    } else if (width >= 992) {
      this.visibleCards.set(3);
    } else if (width >= 768) {
      this.visibleCards.set(2);
    } else {
      this.visibleCards.set(1);
    }

    // Clamp currentSlide value to avoid sliding past the end
    const maxSlide = Math.max(0, this.products().length - this.visibleCards());
    if (this.currentSlide() > maxSlide) {
      this.currentSlide.set(maxSlide);
    }
  }

  /**
   * Slides the track to the next product card.
   */
  nextSlide(): void {
    if (this.isNextDisabled()) return;
    this.currentSlide.update((prev) => prev + 1);
  }

  /**
   * Slides the track to the previous product card.
   */
  prevSlide(): void {
    if (this.isPrevDisabled()) return;
    this.currentSlide.update((prev) => Math.max(0, prev - 1));
  }

  /**
   * Helper to check if the next button should be disabled.
   */
  isNextDisabled(): boolean {
    const productsCount = this.products().length;
    const cardsVisible = this.visibleCards();
    return this.currentSlide() >= Math.max(0, productsCount - cardsVisible);
  }

  /**
   * Helper to check if the previous button should be disabled.
   */
  isPrevDisabled(): boolean {
    return this.currentSlide() <= 0;
  }

  /**
   * Dynamically calculates the transform offset based on RTL/LTR layout direction.
   */
  getSlideTransform(): string {
    const productsCount = this.products().length;
    if (productsCount === 0 || productsCount <= this.visibleCards()) {
      return 'translateX(0)';
    }

    const cardWidthPercent = 100 / this.visibleCards();
    const offset = this.currentSlide() * cardWidthPercent;

    let isRtl = false;
    if (isPlatformBrowser(this.platformId)) {
      isRtl = document.documentElement.dir === 'rtl' || document.dir === 'rtl';
    }

    // LTR requires translating in negative X direction, RTL is positive
    const sign = isRtl ? '' : '-';
    return `translateX(${sign}${offset}%)`;
  }

  /**
   * Add the product to the shopping cart.
   */
  addToCart(product: ILatestCollectionProduct, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!product || !product.id) return;
    
    if (this.cartService.isProductAdding(product.id)) {
      return;
    }
    
    this.cartService.addToCart(product);
  }

  /**
   * Toggles the favorite wishlist state for a product.
   */
  toggleFavorite(product: ILatestCollectionProduct, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!product || !product.id) return;

    const isFav = this.favoritesService.isFavorited(product.id);
    if (isFav) {
      this.favoritesService.removeFavorite(product.id).subscribe();
    } else {
      this.favoritesService.addFavorite(product.id).subscribe();
    }
  }

  /**
   * Retries fetching the products after an error.
   */
  retryFetch(): void {
    this.fetchLatestProducts();
  }

  /**
   * Navigates to the product detail page.
   */
  viewDetails(productId: number | undefined): void {
    if (!productId) return;
    this.router.navigate(['/products', productId]);
  }

  /**
   * Gracefully handles product image load errors by falling back to the placeholder image.
   */
  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/images/image-placeholder.svg';
    }
  }
}
