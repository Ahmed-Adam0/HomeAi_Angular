import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Button } from '../../../../shared/components/button/button.component';
import { CartService } from '../../services/cart.service';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, Button, EmptyStateComponent],
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css'],
})
export class Cart {
  readonly cartService = inject(CartService);
  readonly translationService = inject(TranslationService);
  private router = inject(Router);

  onContinueShopping(): void {
    this.router.navigate(['/products']);
  }

  readonly items = this.cartService.items;
  readonly hasItems = computed(() => this.items().length > 0);
  readonly itemCount = this.cartService.totalQuantity;
  readonly summary = computed(() => ({
    subtotal: this.cartService.totalPrice(),
    shipping: this.cartService.shippingCost(),
    tax: this.cartService.taxAmount(),
    discount: this.cartService.discountAmount(),
    total: this.cartService.grandTotal(),
  }));

  readonly pageTitle = computed(() => this.translationService.translate('NAV_CART'));
  readonly emptyLabel = computed(() => this.translationService.translate('EMPTY_CART'));
  readonly checkoutLabel = computed(() => this.translationService.translate('CHECKOUT'));
  readonly currencySymbol = computed(() => this.translationService.translate('CURRENCY'));
  readonly direction = computed(() => this.translationService.currentLang() === 'ar' ? 'rtl' : 'ltr');

  readonly labels = computed(() => {
    return this.translationService.currentLang() === 'ar'
      ? {
          cartSummary: 'ملخص السلة',
          continueShopping: 'استمر بالتسوق',
          remove: 'إزالة',
          quantity: 'الكمية',
          itemSubtotal: 'المجموع الفرعي',
          shipping: 'الشحن',
          tax: 'الضريبة',
          discount: 'الخصم',
          orderTotal: 'إجمالي الطلب',
          clearCart: 'مسح السلة',
          totalItems: `${this.itemCount()} عناصر في السلة`,
        }
      : {
          cartSummary: 'Cart Summary',
          continueShopping: 'Continue shopping',
          remove: 'Remove',
          quantity: 'Quantity',
          itemSubtotal: 'Subtotal',
          shipping: 'Shipping',
          tax: 'Tax',
          discount: 'Discount',
          orderTotal: 'Order Total',
          clearCart: 'Clear Cart',
          totalItems: `${this.itemCount()} items in cart`,
        };
  });

  updateQuantity(itemId: string, quantity: number): void {
    this.cartService.updateQuantity(itemId, quantity);
  }

  removeItem(itemId: string): void {
    this.cartService.removeFromCart(itemId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
