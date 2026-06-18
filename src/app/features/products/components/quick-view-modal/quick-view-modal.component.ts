import { Component, inject, HostListener, computed, signal, effect } from '@angular/core';
import { QuickViewService } from '../../services/quick-view.service';
import { CartService } from '../../../cart/services/cart.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { calculateOldPrice, calculateDiscountPercentage } from '../../../../shared/utils/price-utils';


@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [CurrencyFormatPipe, TranslatePipe, LocalizedPipe],
  templateUrl: './quick-view-modal.component.html',
  styleUrl: './quick-view-modal.component.css',
})
export class QuickViewModalComponent {
  private quickViewService = inject(QuickViewService);
  readonly cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  readonly translationService = inject(TranslationService);

  protected readonly isOpen = this.quickViewService.isOpen;
  protected readonly product = this.quickViewService.product;

  readonly activeImage = signal<string>('');
  readonly itemQuantity = signal<number>(1);

  readonly productImages = computed<string[]>(() => {
    const prod = this.product();
    if (!prod) return [];
    const list: string[] = [];
    if (prod.mainImageUrl) list.push(prod.mainImageUrl);
    if (prod.images && Array.isArray(prod.images)) {
      prod.images.forEach((img: any) => {
        const url = typeof img === 'string' ? img : img.imageUrl;
        if (url && !list.includes(url)) list.push(url);
      });
    }
    return list;
  });

  readonly isFavorite = computed(() => {
    const prod = this.product();
    return prod ? this.favoritesService.isFavorited(prod.id) : false;
  });

  readonly originalPrice = computed(() => {
    const prod = this.product();
    if (!prod) return null;
    return calculateOldPrice(prod.price);
  });

  readonly hasDiscount = computed(() => {
    const prod = this.product();
    return !!prod && calculateDiscountPercentage(prod) > 0;
  });

  readonly discountPercentage = computed(() => {
    const prod = this.product();
    return prod ? calculateDiscountPercentage(prod) : 0;
  });


  constructor() {
    effect(() => {
      const prod = this.product();
      if (prod) {
        this.activeImage.set(prod.mainImageUrl);
        this.itemQuantity.set(1);
      }
    });
    effect(() => {
      if (this.isOpen()) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close();
  }

  close(): void {
    this.quickViewService.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('qv-overlay')) {
      this.close();
    }
  }

  setActiveImage(img: string): void {
    this.activeImage.set(img);
  }

  incrementQuantity(): void {
    this.itemQuantity.update(q => q + 1);
  }

  decrementQuantity(): void {
    this.itemQuantity.update(q => (q > 1 ? q - 1 : 1));
  }

  addToCart(): void {
    const prod = this.product();
    if (!prod) return;
    if (this.cartService.isProductAdding(prod.id)) return;
    this.cartService.addToCart(prod, this.itemQuantity());
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    const prod = this.product();
    if (!prod) return;
    if (this.isFavorite()) {
      this.favoritesService.removeFavorite(prod.id).subscribe();
    } else {
      this.favoritesService.addFavorite(prod.id).subscribe();
    }
  }

  onMouseMove(event: MouseEvent): void {
    const img = event.currentTarget as HTMLElement;
    const rect = img.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    img.style.transformOrigin = `${x}% ${y}%`;
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) img.src = 'assets/images/image-placeholder.svg';
  }
}
