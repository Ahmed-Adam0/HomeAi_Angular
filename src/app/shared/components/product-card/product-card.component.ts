import { Component, Input, Output, EventEmitter, inject, signal, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf } from '@angular/common';
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
import { ReviewsService, IRatingStats } from '../../../features/products/services/reviews.service';
import { UiState } from '../../../core/state/ui.state';
import { localized } from '../../utils/localized';
import { LocalizedPipe } from '../../pipes/localized.pipe';
import { LazyImageDirective } from '../../directives/lazy-image.directive';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [NgIf, RouterLink, CurrencyFormatPipe, TranslatePipe, LoadingSpinner, LocalizedPipe, LazyImageDirective],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCard implements OnInit {
  @Input({ required: true }) product!: IProduct;
  @Input() mode: 'customer' | 'vendor' = 'customer';

  @Output() delete = new EventEmitter<number>();
  @Output() statusChange = new EventEmitter<{ id: number; isActive: boolean }>();

  readonly translationService = inject(TranslationService);
  readonly cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  private authService = inject(AuthService);
  private reviewsService = inject(ReviewsService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);

  readonly isFavorite = computed(() => this.favoritesService.isFavorited(this.product.id));
  readonly isTogglingFav = signal<boolean>(false);
  readonly ratingStats = signal<IRatingStats | null>(null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.loadRating();
  }

  private loadRating(): void {
    if (this.product.averageRating !== undefined && this.product.totalReviews !== undefined) {
      this.ratingStats.set({
        averageRating: this.product.averageRating,
        totalReviews: this.product.totalReviews
      });
      return;
    }

    this.reviewsService.getProductRating(this.product.id).subscribe({
      next: (stats) => {
        this.ratingStats.set(stats);
      },
      error: () => {
        this.ratingStats.set({ averageRating: 5.0, totalReviews: 0 });
      }
    });
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.isTogglingFav()) return;
    this.isTogglingFav.set(true);

    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(this.product.id).subscribe({
        next: () => {
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
          this.isTogglingFav.set(false);
          this.refreshLocalStorageCache();
          
          // Trigger Success Toast
          const isAr = this.translationService.currentLang() === 'ar';
          const prodName = localized(this.product, 'name', this.translationService.currentLang());
          const msg = isAr ? `تم إضافة "${prodName}" إلى المفضلة` : `"${prodName}" added to favorites`;
          this.uiState.showAlert('success', msg);
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

  onDeleteClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.delete.emit(this.product.id);
  }

  onStatusToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const checkbox = event.target as HTMLInputElement;
    const newStatus = checkbox.checked;
    
    const isAr = this.translationService.currentLang() === 'ar';
    if (!newStatus) {
      const msg = isAr 
        ? 'هل أنت متأكد من رغبتك في أرشفة هذا المنتج؟ سيتم إزالته من المتجر العام وإخفائه عن العملاء.' 
        : 'Are you sure you want to archive this product? It will be removed from the public marketplace and hidden from customers.';
      if (!confirm(msg)) {
        checkbox.checked = true;
        return;
      }
    } else {
      const msg = isAr 
        ? 'هل ترغب في إعادة تفعيل هذا المنتج وعرضه في المتجر للعملاء؟' 
        : 'Do you want to re-activate this product and show it in the marketplace to customers?';
      if (!confirm(msg)) {
        checkbox.checked = false;
        return;
      }
    }
    
    this.statusChange.emit({ id: this.product.id, isActive: newStatus });
  }
}
