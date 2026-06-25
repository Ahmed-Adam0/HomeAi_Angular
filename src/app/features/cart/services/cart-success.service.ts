import { Injectable, signal } from '@angular/core';
import { ICartItem } from '../interfaces/icart-item';

@Injectable({
  providedIn: 'root',
})
export class CartSuccessService {
  readonly isOpen = signal(false);
  readonly item = signal<ICartItem | null>(null);
  readonly quantityAdded = signal(1);

  open(item: ICartItem, quantity: number): void {
    this.item.set(item);
    this.quantityAdded.set(quantity);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  reset(): void {
    this.isOpen.set(false);
    this.item.set(null);
    this.quantityAdded.set(1);
  }
}
