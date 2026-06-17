import { Injectable, effect, inject, signal } from '@angular/core';
import { CartStore } from '../store/cart.store';
import { ICartItem } from '../interfaces/icart-item';

@Injectable({
  providedIn: 'root',
})
export class CartSuccessService {
  readonly isOpen = signal(false);
  readonly item = signal<ICartItem | null>(null);
  readonly quantityAdded = signal(1);

  private cartStore = inject(CartStore);

  constructor() {
    let prevItems = this.cartStore.items();

    effect(() => {
      const currentItems = this.cartStore.items();

      if (currentItems.length > prevItems.length) {
        const newItem = currentItems[currentItems.length - 1];
        this.item.set(newItem);
        this.quantityAdded.set(newItem.quantity);
        this.isOpen.set(true);
        prevItems = currentItems;
        return;
      }

      if (currentItems.length === prevItems.length && prevItems.length > 0) {
        for (const item of currentItems) {
          const prev = prevItems.find(p => p.productId === item.productId);
          if (prev && item.quantity > prev.quantity) {
            this.item.set(item);
            this.quantityAdded.set(item.quantity - prev.quantity);
            this.isOpen.set(true);
            break;
          }
        }
      }

      prevItems = currentItems;
    });
  }

  close(): void {
    this.isOpen.set(false);
  }
}
