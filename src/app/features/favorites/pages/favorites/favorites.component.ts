import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  computed,
  PLATFORM_ID,
  AfterViewInit,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { isPlatformBrowser, NgFor, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { ProductService } from '../../../products/services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { AuthService } from '../../../auth/services/auth.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { IFavoriteItem } from '../../interfaces/ifavorite-item';
import { IProduct } from '../../../products/interfaces/iproduct';
import { IProductFilter } from '../../../products/interfaces/iproduct-filter';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { LOCAL_STORAGE_KEYS } from '../../../../core/constants/localstorage-keys';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterLink,
    CurrencyFormatPipe,
    LocalizedPipe,
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
})
export class Favorites implements OnInit, OnDestroy, AfterViewInit {
  private favoritesService = inject(FavoritesService);
  private productService = inject(ProductService);
  readonly cartService = inject(CartService);
  readonly authService = inject(AuthService);
  readonly translationService = inject(TranslationService);
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Core state signals
  readonly favorites = signal<IFavoriteItem[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isAddingAll = signal<boolean>(false);
  readonly addAllSuccess = signal<boolean>(false);
  readonly removingIds = signal<Set<number>>(new Set());

  // AI suggestions — load real products dynamically from a different category
  readonly suggestions = signal<IProduct[]>([]);

  readonly totalValue = computed(() =>
    this.favorites().reduce((sum, f) => sum + (f.salePrice ?? f.price), 0)
  );

  readonly favCount = computed(() => this.favorites().length);

  ngOnInit(): void {
    this.loadFavorites();
    this.loadSuggestions();
  }

  ngOnDestroy(): void {}

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      setTimeout(() => {
        const sections = this.el.nativeElement.querySelectorAll(
          '.favorites-header, .favorites-grid-area, .sidebar-panel'
        );
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                this.renderer.addClass(entry.target, 'fav-visible');
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.05, rootMargin: '0px 0px -5% 0px' }
        );
        sections.forEach((el: HTMLElement) => {
          this.renderer.addClass(el, 'fav-reveal');
          observer.observe(el);
        });
      }, 150);
    }
  }

  private loadFavorites(): void {
    this.isLoading.set(true);
    this.favoritesService.getFavorites().subscribe({
      next: (favs) => {
        this.favorites.set(favs || []);
        this.syncLocalStorage(favs || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load favorites:', err);
        // Fallback: try localStorage cache
        if (this.isBrowser) {
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
            if (raw) {
              this.favorites.set(JSON.parse(raw) || []);
            }
          } catch {}
        }
        this.isLoading.set(false);
      },
    });
  }

  private loadSuggestions(): void {
    // Load real products dynamically as AI suggestions
    const filter: IProductFilter = { page: 1, limit: 3, isNewArrival: true };
    this.productService.getProducts(filter).subscribe({
      next: (products) => {
        this.suggestions.set((products || []).slice(0, 3));
      },
      error: () => {
        // Fallback to any available products
        this.productService.getProducts({ page: 1, limit: 3 }).subscribe({
          next: (p) => this.suggestions.set((p || []).slice(0, 3)),
          error: () => this.suggestions.set([]),
        });
      },
    });
  }

  removeFavorite(fav: IFavoriteItem, event: Event): void {
    event.stopPropagation();
    const productId = Number(fav.productId);

    // Optimistic removal — update UI immediately
    this.removingIds.update((ids) => {
      const next = new Set(ids);
      next.add(productId);
      return next;
    });

    // Remove from local list instantly for snappy UX
    this.favorites.update((list) =>
      list.filter((f) => Number(f.productId) !== productId)
    );

    this.favoritesService.removeFavorite(productId).subscribe({
      next: () => {
        // Refresh from API to ensure consistency
        this.favoritesService.getFavorites().subscribe({
          next: (favs) => {
            this.favorites.set(favs || []);
            this.syncLocalStorage(favs || []);
          },
        });
        this.removingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(productId);
          return next;
        });
      },
      error: (err) => {
        console.error('Failed to remove favorite:', err);
        // Re-add on failure
        this.loadFavorites();
        this.removingIds.update((ids) => {
          const next = new Set(ids);
          next.delete(productId);
          return next;
        });
      },
    });
  }

  addAllToCart(): void {
    const favs = this.favorites();
    if (!favs.length || this.isAddingAll()) return;

    this.isAddingAll.set(true);

    // Build a minimal IProduct-like object from each favorite to pass to cart service
    const addPromises = favs.map((fav) => {
      const pseudoProduct: IProduct = {
        id: Number(fav.productId),
        nameEn: fav.productName,
        nameAr: fav.productName,
        descriptionEn: '',
        descriptionAr: '',
        price: fav.salePrice ?? fav.price,
        categoryId: 0,
        categoryNameEn: '',
        categoryNameAr: '',
        workshopId: 0,
        workshopNameEn: '',
        workshopNameAr: '',
        createdAt: '',
        mainImageUrl: fav.productImage,
      };
      return this.cartService.addToCart(pseudoProduct, 1);
    });

    Promise.all(addPromises)
      .then(() => {
        this.addAllSuccess.set(true);
        setTimeout(() => this.addAllSuccess.set(false), 3000);
      })
      .finally(() => {
        this.isAddingAll.set(false);
      });
  }

  isRemoving(fav: IFavoriteItem): boolean {
    return this.removingIds().has(Number(fav.productId));
  }

  handleImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/image-placeholder.svg';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  private syncLocalStorage(favs: IFavoriteItem[]): void {
    if (this.isBrowser) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      window.dispatchEvent(new Event('storage'));
    }
  }
}
