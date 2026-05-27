import { Component, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IProduct } from '../../../features/products/interfaces/iproduct';
import { CurrencyFormatPipe } from '../../pipes/currency-format.pipe';
import { TranslationService } from '../../i18n/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CartService } from '../../../features/cart/services/cart.service';
import { LoadingSpinner } from '../loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyFormatPipe, TranslatePipe, LoadingSpinner],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css',
})
export class ProductCard {
  @Input({ required: true }) product!: IProduct;

  readonly translationService = inject(TranslationService);
  readonly isFavorite = signal<boolean>(false);
  readonly cartService = inject(CartService);

  toggleFavorite(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.isFavorite.update((fav) => !fav);
  }

  addToCart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.cartService.isProductAdding(this.product.id)) {
      return;
    }
    this.cartService.addToCart(this.product);
  }
}
