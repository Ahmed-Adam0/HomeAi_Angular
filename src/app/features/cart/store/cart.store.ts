import { Injectable, computed, effect, signal } from '@angular/core';
import { ICartItem } from '../interfaces/icart-item';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/localstorage-keys';

const CART_STORAGE_KEY = LOCAL_STORAGE_KEYS.CART;
const SHIPPING_FEE = 29;
const TAX_RATE = 0.075;

@Injectable({
  providedIn: 'root',
})
export class CartStore {
  readonly items = signal<ICartItem[]>(this.loadInitialItems());

  // Computed signals
  readonly totalItems = computed(() => this.items().length);
  readonly subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  readonly totalQuantity = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  // Derived computed signals
  readonly totalPrice = this.subtotal; // Alias for backward compatibility
  readonly shippingCost = computed(() => (this.totalItems() > 0 ? SHIPPING_FEE : 0));
  readonly taxAmount = computed(() => Number((this.subtotal() * TAX_RATE).toFixed(2)));
  readonly discountAmount = computed(() => 0);
  readonly grandTotal = computed(
    () =>
      Number(
        (
          this.subtotal() +
          this.shippingCost() +
          this.taxAmount() -
          this.discountAmount()
        ).toFixed(2)
      )
  );

  readonly totals = computed(() => ({
    totalQuantity: this.totalQuantity(),
    totalPrice: this.totalPrice(),
    shippingCost: this.shippingCost(),
    taxAmount: this.taxAmount(),
    discountAmount: this.discountAmount(),
    grandTotal: this.grandTotal(),
  }));

  constructor() {
    effect(() => {
      if (typeof window === 'undefined') {
        return;
      }

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.items()));
    });
  }

  setItems(items: ICartItem[]): void {
    this.items.set(items);
  }

  clear(): void {
    this.items.set([]);
  }

  static parseRawItems(raw: string | null): ICartItem[] {
    if (!raw) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      let items: ICartItem[] = [];

      if (Array.isArray(parsed)) {
        items = parsed;
      } else if (
        parsed &&
        typeof parsed === 'object' &&
        'items' in parsed &&
        Array.isArray((parsed as { items: unknown }).items)
      ) {
        items = (parsed as { items: ICartItem[] }).items;
      }

      return items.map((item) => {
        const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
        const price = Math.max(0, Number(item.price) || 0);
        return {
          ...item,
          id: String(item.id || item.productId || ''),
          productId: String(item.productId || item.id || ''),
          quantity: qty,
          price: price,
          subtotal: Number((price * qty).toFixed(2)),
        };
      });
    } catch {
      return [];
    }
  }

  private loadInitialItems(): ICartItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return CartStore.parseRawItems(raw);
    } catch {
      return [];
    }
  }
}
