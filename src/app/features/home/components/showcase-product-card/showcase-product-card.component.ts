import { Component, Input, inject, signal, computed, ViewChild } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IProduct } from '../../../products/interfaces/iproduct';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CartService } from '../../../cart/services/cart.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { UiState } from '../../../../core/state/ui.state';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { ThreeDViewerComponent } from '../../../../shared/components/three-d-viewer/three-d-viewer.component';
import { calculateOldPrice, calculateDiscountPercentage } from '../../../../shared/utils/price-utils';
import { localized } from '../../../../shared/utils/localized';

@Component({
  selector: 'app-showcase-product-card',
  standalone: true,
  imports: [NgIf, NgClass, RouterLink, CurrencyFormatPipe, TranslatePipe, LocalizedPipe, ThreeDViewerComponent],
  templateUrl: './showcase-product-card.component.html',
  styleUrl: './showcase-product-card.component.css'
})
export class ShowcaseProductCardComponent {
  @Input({ required: true }) product!: IProduct;
  @Input() isMobile = false;

  @ViewChild('viewer') viewerComponent?: ThreeDViewerComponent;

  readonly translationService = inject(TranslationService);
  readonly cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  private uiState = inject(UiState);

  readonly isFavorite = computed(() => this.favoritesService.isFavorited(this.product.id));
  readonly isTogglingFav = signal<boolean>(false);

  getOldPrice(): number {
    return calculateOldPrice(this.product.price, this.product);
  }

  getDiscountPercentage(): number {
    return calculateDiscountPercentage(this.product);
  }

  isHot(): boolean {
    return this.product.status === 'hot' || (this.product.averageRating !== undefined && this.product.averageRating >= 4.8);
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (this.isTogglingFav()) return;
    this.isTogglingFav.set(true);

    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(this.product.id).subscribe({
        next: () => this.isTogglingFav.set(false),
        error: () => this.isTogglingFav.set(false),
      });
    } else {
      this.favoritesService.addFavorite(this.product.id).subscribe({
        next: () => {
          this.isTogglingFav.set(false);
          const isAr = this.translationService.currentLang() === 'ar';
          const prodName = localized(this.product, 'name', this.translationService.currentLang());
          const msg = isAr ? `تم إضافة "${prodName}" إلى المفضلة` : `"${prodName}" added to favorites`;
          this.uiState.showAlert('success', msg, { label: isAr ? 'عرض المفضلة' : 'View Favorites', routerLink: '/favorites' });
        },
        error: () => this.isTogglingFav.set(false),
      });
    }
  }

  addToCart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.cartService.isProductAdding(this.product.id)) {
      return;
    }

    this.cartService.addToCart(this.product).then(() => {
      const isAr = this.translationService.currentLang() === 'ar';
      const prodName = localized(this.product, 'name', this.translationService.currentLang());
      const msg = isAr ? `تم إضافة "${prodName}" إلى العربة بنجاح` : `"${prodName}" added to cart successfully`;
      this.uiState.showAlert('success', msg, { 
        label: isAr ? 'عرض العربة' : 'View Cart', 
        routerLink: '/cart' 
      });
    });
  }

  triggerAR(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (this.viewerComponent) {
      this.viewerComponent.triggerAR();
    } else {
      console.warn('3D Viewer component is not loaded for AR action.');
    }
  }
}
