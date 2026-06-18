import { Component, inject, HostListener, computed, signal, effect } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { QuickViewService } from '../../services/quick-view.service';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../../cart/services/cart.service';
import { FavoritesService } from '../../../favorites/services/favorites.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { calculateOldPrice, calculateDiscountPercentage } from '../../../../shared/utils/price-utils';
import { IProduct } from '../../interfaces/iproduct';

@Component({
  selector: 'app-quick-view-modal',
  standalone: true,
  imports: [NgIf, NgFor, CurrencyFormatPipe, TranslatePipe, LocalizedPipe],
  templateUrl: './quick-view-modal.component.html',
  styleUrl: './quick-view-modal.component.css',
})
export class QuickViewModalComponent {
  private quickViewService = inject(QuickViewService);
  private productService = inject(ProductService);
  readonly cartService = inject(CartService);
  private favoritesService = inject(FavoritesService);
  readonly translationService = inject(TranslationService);

  protected readonly isOpen = this.quickViewService.isOpen;
  protected readonly product = this.quickViewService.product;
  
  protected readonly detailedProduct = signal<IProduct | null>(null);
  readonly isLoadingDetails = signal<boolean>(false);

  readonly activeImage = signal<string>('');
  readonly itemQuantity = signal<number>(1);

  readonly productImages = computed<string[]>(() => {
    const prod = this.detailedProduct();
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
    const prod = this.detailedProduct();
    return prod ? this.favoritesService.isFavorited(prod.id) : false;
  });

  readonly originalPrice = computed(() => {
    const prod = this.detailedProduct();
    if (!prod) return null;
    return calculateOldPrice(prod.price, prod);
  });

  readonly hasDiscount = computed(() => {
    const prod = this.detailedProduct();
    return !!prod && calculateDiscountPercentage(prod) > 0;
  });

  readonly discountPercentage = computed(() => {
    const prod = this.detailedProduct();
    return prod ? calculateDiscountPercentage(prod) : 0;
  });

  constructor() {
    effect(() => {
      const prod = this.product();
      if (prod) {
        this.isLoadingDetails.set(true);
        this.productService.getProductById(prod.id).subscribe({
          next: (detailedProd) => {
            this.detailedProduct.set(detailedProd);
            this.activeImage.set(detailedProd.mainImageUrl);
            this.itemQuantity.set(1);
            this.isLoadingDetails.set(false);
          },
          error: (err) => {
            console.error('Failed to load product details for quick view', err);
            this.detailedProduct.set(prod);
            this.activeImage.set(prod.mainImageUrl);
            this.itemQuantity.set(1);
            this.isLoadingDetails.set(false);
          }
        });
      } else {
        this.detailedProduct.set(null);
      }
    }, { allowSignalWrites: true });

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
    const prod = this.detailedProduct();
    if (!prod) return;
    if (this.cartService.isProductAdding(prod.id)) return;
    this.cartService.addToCart(prod, this.itemQuantity());
  }

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    const prod = this.detailedProduct();
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
