import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants';
import { ICartItem } from '../interfaces/icart-item';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly items = signal<ICartItem[]>([]);

  readonly itemCount = computed(() =>
    this.items().reduce((total, item) => total + (item.quantity ?? 0), 0)
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshFromStorage();
      window.addEventListener('storage', this.onStorageChange);
    }
  }

  refreshFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.items.set([]);
      return;
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.CART);
      if (!raw) {
        this.items.set([]);
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.items.set(parsed as ICartItem[]);
        return;
      }

      if (
        parsed &&
        typeof parsed === 'object' &&
        'items' in parsed &&
        Array.isArray((parsed as { items: unknown }).items)
      ) {
        this.items.set((parsed as { items: ICartItem[] }).items);
        return;
      }

      this.items.set([]);
    } catch {
      this.items.set([]);
    }
  }

  private readonly onStorageChange = (event: StorageEvent): void => {
    if (event.key === LOCAL_STORAGE_KEYS.CART || event.key === null) {
      this.refreshFromStorage();
    }
  };
}
