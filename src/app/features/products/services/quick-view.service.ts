import { Injectable, signal } from '@angular/core';
import { IProduct } from '../interfaces/iproduct';

@Injectable({
  providedIn: 'root',
})
export class QuickViewService {
  readonly isOpen = signal(false);
  readonly product = signal<IProduct | null>(null);

  open(product: IProduct): void {
    this.product.set(product);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
