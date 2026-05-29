import { Component, Input, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProduct } from '../../../features/products/interfaces/iproduct';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CartService } from '../../../features/cart/services/cart.service';
import { FavoritesService } from '../../../features/favorites/services/favorites.service';
import { AuthService } from '../../../features/auth/services/auth.service';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.component';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/localstorage-keys';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, TranslatePipe, LoadingSpinner],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCard implements OnInit {
  @Input({ required: true }) product!: IProduct;

  readonly translationService = inject(TranslationService);
  readonly cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  readonly isFavorite = signal<boolean>(false);
  readonly isTogglingFav = signal<boolean>(false);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.syncFavoriteState();
  }

  private syncFavoriteState(): void {
    if (!this.authService.isLoggedIn()) {
      this.isFavorite.set(false);
      return;
    }

    // Fast sync from localStorage cache
    if (this.isBrowser) {
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const found = list.some((f: any) => Number(f.productId) === this.product.id);
            this.isFavorite.set(found);
          }
        }
      } catch {}
    }

    // Override with authoritative shared signal if it has data
    if (this.favoritesService.favorites().length > 0) {
      this.isFavorite.set(this.favoritesService.isFavorited(this.product.id));
    }
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.isLoggedIn()) {
      // Redirect happens upstream — just do a local optimistic toggle for guest UX
      this.isFavorite.update((v) => !v);
      return;
    }

    if (this.isTogglingFav()) return;
    this.isTogglingFav.set(true);

    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(this.product.id).subscribe({
        next: () => {
          this.isFavorite.set(false);
          this.isTogglingFav.set(false);
          this.refreshLocalStorageCache();
        },
        error: () => {
          this.isTogglingFav.set(false);
        },
      });
    } else {
      this.favoritesService.addFavorite(this.product.id).subscribe({
        next: () => {
          this.isFavorite.set(true);
          this.isTogglingFav.set(false);
          this.refreshLocalStorageCache();
        },
        error: () => {
          this.isTogglingFav.set(false);
        },
      });
    }
  }

  addToCart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.cartService.isProductAdding(this.product.id)) {
      return;
    }
    this.cartService.addToCart(this.product);
  }

  private refreshLocalStorageCache(): void {
    this.favoritesService.getFavorites().subscribe({
      next: () => {
        // FavoritesService.syncToLocalStorage already dispatches the StorageEvent
        // so the navbar counter updates automatically
      },
    });
  }
}
