import { Injectable, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ICart, ICartItem } from '../interfaces';
import { CartStore } from '../store/cart.store';
import { IProduct } from '../../products/interfaces/iproduct';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartStore = inject(CartStore);
  private readonly platformId = inject(PLATFORM_ID);

  readonly items = this.cartStore.items;
  readonly totalQuantity = this.cartStore.totalQuantity;
  readonly totalPrice = this.cartStore.totalPrice;
  readonly shippingCost = this.cartStore.shippingCost;
  readonly taxAmount = this.cartStore.taxAmount;
  readonly discountAmount = this.cartStore.discountAmount;
  readonly grandTotal = this.cartStore.grandTotal;

  readonly hasItems = computed(() => this.items().length > 0);
  readonly itemCount = computed(() =>
  this.items().reduce((total, item) => total + item.quantity, 0)
);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshFromStorage();
      window.addEventListener('storage', this.onStorageChange);
    }
  }

  addToCart(product: IProduct, quantity = 1): void {
    const itemId = product.id.toString();
    const quantityToAdd = Math.max(1, Math.round(quantity));

    const existingItem = this.items().find(
      (item) => item.id === itemId
    );

    if (existingItem) {
      this.items.update((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: item.quantity + quantityToAdd,
                subtotal: Number(
                  (
                    (item.quantity + quantityToAdd) *
                    item.price
                  ).toFixed(2)
                ),
              }
            : item
        )
      );

      return;
    }

    const newItem: ICartItem = {
      id: itemId,
      productId: itemId,
      productName: product.nameEn,
      productNameEn: product.nameEn,
      productNameAr: product.nameAr,
      productImage: product.mainImageUrl,
      price: Number(product.price),
      quantity: quantityToAdd,
      subtotal: Number(
        (product.price * quantityToAdd).toFixed(2)
      ),
    };

    this.items.update((current) => [...current, newItem]);
  }

  removeFromCart(itemId: string): void {
    this.items.update((current) =>
      current.filter((item) => item.id !== itemId)
    );
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    this.items.update((current) =>
      current.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: Number(
                (item.price * quantity).toFixed(2)
              ),
            }
          : item
      )
    );
  }

  clearCart(): void {
    this.cartStore.clear();
  }

  getCart(): ICart {
    return {
      items: this.items(),
      totalQuantity: this.totalQuantity(),
      totalPrice: this.totalPrice(),
      shippingCost: this.shippingCost(),
      taxAmount: this.taxAmount(),
      discountAmount: this.discountAmount(),
      grandTotal: this.grandTotal(),
    };
  }

  calculateTotals() {
    return {
      totalQuantity: this.totalQuantity(),
      totalPrice: this.totalPrice(),
      shippingCost: this.shippingCost(),
      taxAmount: this.taxAmount(),
      discountAmount: this.discountAmount(),
      grandTotal: this.grandTotal(),
    };
  }

  refreshFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const raw = localStorage.getItem(
        LOCAL_STORAGE_KEYS.CART
      );

      if (!raw) {
        return;
      }

      const parsed: unknown = JSON.parse(raw);

      if (
        parsed &&
        typeof parsed === 'object' &&
        'items' in parsed &&
        Array.isArray((parsed as { items: unknown }).items)
      ) {
        this.items.set(
          (parsed as { items: ICartItem[] }).items
        );
      }
    } catch {}
  }

  private readonly onStorageChange = (
    event: StorageEvent
  ): void => {
    if (
      event.key === LOCAL_STORAGE_KEYS.CART ||
      event.key === null
    ) {
      this.refreshFromStorage();
    }
  };
}