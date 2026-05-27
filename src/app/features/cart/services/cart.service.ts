import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ICart, ICartItem } from '../interfaces';
import { CartStore } from '../store/cart.store';
import { IProduct } from '../../products/interfaces/iproduct';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants';
import { UiState } from '../../../core/state/ui.state';
import { TranslationService } from '../../../shared/i18n/translation.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartStore = inject(CartStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly uiState = inject(UiState);
  private readonly translationService = inject(TranslationService);
  private readonly loadingStates = signal<Record<string, boolean>>({});

  readonly items = this.cartStore.items;
  readonly totalItems = this.cartStore.totalItems;
  readonly subtotal = this.cartStore.subtotal;
  readonly totalQuantity = this.cartStore.totalQuantity;
  readonly totalPrice = this.cartStore.totalPrice;
  readonly shippingCost = this.cartStore.shippingCost;
  readonly taxAmount = this.cartStore.taxAmount;
  readonly discountAmount = this.cartStore.discountAmount;
  readonly grandTotal = this.cartStore.grandTotal;

  readonly hasItems = computed(() => this.totalItems() > 0);
  readonly itemCount = this.totalQuantity;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshFromStorage();
      window.addEventListener('storage', this.onStorageChange);
    }
  }

  isProductAdding(productId: string | number): boolean {
    return !!this.loadingStates()[String(productId)];
  }

  addToCart(product: IProduct, quantity = 1): Promise<void> {
    const itemId = product.id.toString().trim();
    if (this.loadingStates()[itemId]) {
      return Promise.resolve();
    }

    this.loadingStates.update((states) => ({ ...states, [itemId]: true }));

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        try {
          const isAr = this.translationService.currentLang() === 'ar';
          const productTitle = isAr ? product.nameAr : product.nameEn;

          // 1. Invalid Quantity Check
          if (isNaN(quantity) || quantity <= 0) {
            const errorMsg = isAr
              ? 'كمية غير صالحة: يرجى إدخال كمية صالحة أكبر من 0.'
              : 'Invalid quantity: Please enter a valid quantity greater than 0.';
            this.uiState.showAlert('danger', errorMsg);
            resolve();
            return;
          }

          const quantityToAdd = Math.round(Number(quantity));
          const productPrice = Math.max(0, Number(product.price) || 0);

          const existingItem = this.items().find(
            (item) =>
              String(item.id).trim() === itemId ||
              String(item.productId).trim() === itemId
          );

          const currentQty = existingItem ? existingItem.quantity : 0;
          const newQty = currentQty + quantityToAdd;
          const MAX_STOCK_LIMIT = 10;

          // 2. Stock Issues Check
          if (newQty > MAX_STOCK_LIMIT) {
            const errorMsg = isAr
              ? `لا يمكن إضافة ${productTitle}. تم الوصول إلى الحد الأقصى للمخزون المتوفر (${MAX_STOCK_LIMIT} قطع).`
              : `Cannot add ${productTitle}. Maximum available stock limit reached (${MAX_STOCK_LIMIT} items).`;
            this.uiState.showAlert('danger', errorMsg);
            resolve();
            return;
          }

          if (existingItem) {
            this.items.update((current) =>
              current.map((item) =>
                String(item.id).trim() === itemId ||
                String(item.productId).trim() === itemId
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
          } else {
            const newItem: ICartItem = {
              id: itemId,
              productId: itemId,
              productName: product.nameEn,
              productNameEn: product.nameEn,
              productNameAr: product.nameAr,
              productImage: product.mainImageUrl,
              price: productPrice,
              quantity: quantityToAdd,
              subtotal: Number(
                (productPrice * quantityToAdd).toFixed(2)
              ),
            };

            this.items.update((current) => [...current, newItem]);
          }

          // 3. Success Feedback Trigger
          const successMsg = isAr
            ? `تمت إضافة ${quantityToAdd} × ${productTitle} إلى سلة التسوق بنجاح.`
            : `Added ${quantityToAdd} × ${productTitle} to your cart successfully.`;
          this.uiState.showAlert('success', successMsg);
        } catch (error) {
          // 4. Failed Add Action Check
          const isAr = this.translationService.currentLang() === 'ar';
          const productTitle = isAr ? product.nameAr : product.nameEn;
          const errorMsg = isAr
            ? `فشلت إضافة ${productTitle} إلى سلة التسوق. يرجى المحاولة مرة أخرى.`
            : `Failed to add ${productTitle} to your cart. Please try again.`;
          this.uiState.showAlert('danger', errorMsg);
        } finally {
          this.loadingStates.update((states) => ({ ...states, [itemId]: false }));
          resolve();
        }
      }, 600);
    });
  }

  removeFromCart(itemId: string): void {
    const targetId = itemId.trim();
    this.items.update((current) =>
      current.filter(
        (item) =>
          String(item.id).trim() !== targetId &&
          String(item.productId).trim() !== targetId
      )
    );
  }

  updateQuantity(itemId: string, quantity: number): void {
    const cleanQty = Math.round(Number(quantity));
    if (isNaN(cleanQty) || cleanQty <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const targetId = itemId.trim();
    this.items.update((current) =>
      current.map((item) =>
        String(item.id).trim() === targetId ||
        String(item.productId).trim() === targetId
          ? {
              ...item,
              quantity: cleanQty,
              subtotal: Number(
                (item.price * cleanQty).toFixed(2)
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
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CART);
      const cleanItems = CartStore.parseRawItems(raw);

      const currentItemsStr = JSON.stringify(this.items());
      const cleanItemsStr = JSON.stringify(cleanItems);
      if (currentItemsStr !== cleanItemsStr) {
        this.items.set(cleanItems);
      }
    } catch {}
  }

  private readonly onStorageChange = (event: StorageEvent): void => {
    if (
      event.key === LOCAL_STORAGE_KEYS.CART ||
      event.key === null
    ) {
      this.refreshFromStorage();
    }
  };
}