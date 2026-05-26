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
  readonly totalQuantity = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly totalPrice = computed(() => this.items().reduce((sum, item) => sum + item.price * item.quantity, 0));
  readonly shippingCost = computed(() => (this.items().length ? SHIPPING_FEE : 0));
  readonly taxAmount = computed(() => Number((this.totalPrice() * TAX_RATE).toFixed(2)));
  readonly discountAmount = computed(() => 0);
  readonly grandTotal = computed(
    () => Number((this.totalPrice() + this.shippingCost() + this.taxAmount() - this.discountAmount()).toFixed(2))
  );

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

  private loadInitialItems(): ICartItem[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as ICartItem[];
      return Array.isArray(parsed)
        ? parsed.map((item) => ({
            ...item,
            quantity: Math.max(1, Math.round(item.quantity)),
            subtotal: Number((item.price * Math.max(1, Math.round(item.quantity))).toFixed(2)),
          }))
        : [];
    } catch {
      return [];
    }
  }
}
