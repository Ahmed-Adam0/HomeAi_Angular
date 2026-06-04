import { Injectable, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ICart, ICartItem } from '../interfaces';
import { CartStore } from '../store/cart.store';
import { IProduct } from '../../products/interfaces/iproduct';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants';
import { UiState } from '../../../core/state/ui.state';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { CartApiService } from './cart-api.service';
import { AuthService } from '../../auth/services/auth.service';
import { unwrap } from '../../../core/utils/api-utils';
import { localized } from '../../../shared/utils/localized';
import { firstValueFrom, filter, from, Observable, switchMap, tap, distinctUntilChanged } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly cartStore = inject(CartStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly uiState = inject(UiState);
  private readonly translationService = inject(TranslationService);
  private readonly cartApi = inject(CartApiService);
  private readonly authService = inject(AuthService);
  private readonly loadingStates = signal<Record<string, { adding?: boolean; updating?: boolean; removing?: boolean }>>({});
  private readonly activeSyncRequests = new Set<string>();
  private readonly updateQuantityDebounceTimers = new Map<string, any>();
  private readonly pendingUpdatePromises = new Map<string, Promise<any>>();

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
  readonly cartBusy = computed(() =>
    Object.values(this.loadingStates()).some(
      (state) => state?.adding || state?.updating || state?.removing
    )
  );

  private setItemActionState(
    itemId: string,
    action: 'adding' | 'updating' | 'removing',
    value: boolean
  ): void {
    this.loadingStates.update((states) => ({
      ...states,
      [itemId]: {
        ...states[itemId],
        [action]: value,
      },
    }));
  }

  private normalizeKey(value: string | number | undefined | null): string {
    return value == null ? '' : String(value).trim();
  }

  private isMatchingCartItem(item: ICartItem, itemKey: string): boolean {
    const normalizedKey = this.normalizeKey(itemKey);
    if (!normalizedKey) {
      return false;
    }

    return (
      this.normalizeKey(item.id) === normalizedKey ||
      this.normalizeKey(item.productId) === normalizedKey ||
      this.normalizeKey(item.cartItemId) === normalizedKey
    );
  }

  private findCartItem(itemKey: string): ICartItem | undefined {
    const normalizedKey = this.normalizeKey(itemKey);
    if (!normalizedKey) {
      return undefined;
    }

    return this.items().find((item) => this.isMatchingCartItem(item, normalizedKey));
  }

  private updateLocalCartItem(itemKey: string, updater: (item: ICartItem) => ICartItem): void {
    this.items.update((current) =>
      current.map((item) =>
        this.isMatchingCartItem(item, itemKey) ? updater(item) : item
      )
    );
  }

  private removeLocalCartItem(itemKey: string): void {
    this.items.update((current) =>
      current.filter((item) => !this.isMatchingCartItem(item, itemKey))
    );
  }

  private consolidateCartItems(items: ICartItem[]): ICartItem[] {
    const grouped = new Map<string, ICartItem>();

    for (const item of items) {
      const productKey = this.normalizeKey(item.productId || item.id);
      const cartKey = this.normalizeKey(item.cartItemId || item.id);
      const mapKey = productKey || cartKey;

      const existing = grouped.get(mapKey);
      if (existing) {
        const quantity = existing.quantity + item.quantity;
        grouped.set(mapKey, {
          ...existing,
          quantity,
          subtotal: Number((existing.price * quantity).toFixed(2)),
          cartItemId: existing.cartItemId || item.cartItemId,
        });
      } else {
        grouped.set(mapKey, {
          ...item,
          id: this.normalizeKey(item.id || productKey),
          productId: this.normalizeKey(item.productId || productKey || item.id),
          cartItemId: this.normalizeKey(item.cartItemId) || undefined,
        });
      }
    }

    return Array.from(grouped.values());
  }

  private applyBackendResponseToLocalState(response: any): void {
    const backendItems = this.parseBackendCartItems(response);
    if (!backendItems.length) {
      return;
    }

    backendItems.forEach((backendItem) => {
      const lookupKey = backendItem.productId || backendItem.id || backendItem.cartItemId;
      if (!lookupKey) {
        return;
      }

      this.updateLocalCartItem(lookupKey, (current) => ({
        ...current,
        cartItemId: backendItem.cartItemId || current.cartItemId,
        productId: backendItem.productId || current.productId,
        id: current.id || backendItem.id,
        price: backendItem.price || current.price,
        quantity: backendItem.quantity,
        subtotal: backendItem.subtotal,
      }));
    });
  }

  private async resolveBackendCartItemId(item: ICartItem): Promise<string | undefined> {
    if (item.cartItemId) {
      return item.cartItemId;
    }

    if (!this.authService.isAuthenticated()) {
      return undefined;
    }

    try {
      const backendCart = await firstValueFrom(this.cartApi.getCart());
      const backendItems = this.parseBackendCartItems(backendCart);
      const match = backendItems.find((backendItem) =>
        this.normalizeKey(backendItem.productId) === this.normalizeKey(item.productId) ||
        this.normalizeKey(backendItem.id) === this.normalizeKey(item.id)
      );

      if (match?.cartItemId) {
        this.updateLocalCartItem(item.id, (current) => ({ ...current, cartItemId: match.cartItemId }));
        return match.cartItemId;
      }
    } catch (err) {
      console.error('Unable to resolve backend cart item id:', err);
    }

    return undefined;
  }

  private async syncCartItemIdFromResponse(itemKey: string, response: any): Promise<void> {
    const backendItems = this.parseBackendCartItems(response);
    if (!backendItems.length) {
      return;
    }

    backendItems.forEach((backendItem) => {
      const lookupKey = backendItem.productId || backendItem.id || backendItem.cartItemId;
      if (!lookupKey) {
        return;
      }

      this.updateLocalCartItem(lookupKey, (current) => ({
        ...current,
        cartItemId: backendItem.cartItemId || current.cartItemId,
        productId: backendItem.productId || current.productId,
        id: current.id || backendItem.id,
      }));
    });
  }

  isProductAdding(productId: string | number): boolean {
    return !!this.loadingStates()[String(productId)]?.adding;
  }

  isItemUpdating(itemId: string | number): boolean {
    return !!this.loadingStates()[String(itemId)]?.updating;
  }

  isItemRemoving(itemId: string | number): boolean {
    return !!this.loadingStates()[String(itemId)]?.removing;
  }

  isItemPending(itemId: string | number): boolean {
    const state = this.loadingStates()[String(itemId)];
    return !!state?.adding || !!state?.updating || !!state?.removing;
  }
  readonly totals = this.cartStore.totals;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.refreshFromStorage();
      window.addEventListener('storage', this.onStorageChange);

      // Auth-driven cart synchronization pipeline:
      // - only run backend sync when auth state changes to true
      // - clear local cart on logout
      // - avoid repeated sync bursts from cart item signal changes
      toObservable(this.authService.isAuthenticated).pipe(
        distinctUntilChanged(),
        tap((authenticated) => {
          if (!authenticated) {
            this.cartStore.clear();
          }
        }),
        filter(Boolean),
        switchMap(() => from(this.syncCartFromBackend()))
      ).subscribe({
        error: (error: unknown) => {
          console.error('Auth cart sync failed:', error);
        }
      });
    }
  }

  /**
   * Safely map raw backend response to frontend ICartItem[] structure defensively.
   */
  private parseBackendCartItems(response: any): ICartItem[] {
    if (!response) return [];

    const unwrapped = unwrap<any>(response);
    let rawItems: any[] = [];

    if (Array.isArray(unwrapped)) {
      rawItems = unwrapped;
    } else if (unwrapped && typeof unwrapped === 'object') {
      if (Array.isArray(unwrapped.items)) {
        rawItems = unwrapped.items;
      } else if (Array.isArray(unwrapped.cartItems)) {
        rawItems = unwrapped.cartItems;
      } else if (Array.isArray(unwrapped.data)) {
        rawItems = unwrapped.data;
      } else if (Array.isArray(unwrapped.value)) {
        rawItems = unwrapped.value;
      }
    }

    if (!Array.isArray(rawItems)) {
      return [];
    }

    const items = rawItems.map((item: any) => {
      const rawCartItemId = item.cartItemId ?? item.cartItemID ?? item.itemId ?? '';
      const productIdFromProduct = item.product?.id ?? item.product?.productId;
      const rawProductId = item.productId ?? productIdFromProduct ?? '';
      const rawId = item.id ?? '';

      const normalizedCartItemId = this.normalizeKey(rawCartItemId);
      const normalizedProductId = this.normalizeKey(rawProductId);
      const normalizedId = this.normalizeKey(rawId);

      const cartItemId = normalizedCartItemId || (normalizedId && normalizedId !== normalizedProductId ? normalizedId : '');
      const productId = normalizedProductId || (normalizedId && normalizedId !== cartItemId ? normalizedId : '');
      const itemId = cartItemId || productId || normalizedId;
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const price = Math.max(0, Number(item.price || item.product?.price || 0));

      const productNameEn =
        item.productNameEn || item.productName || item.product?.nameEn || item.product?.name || '';
      const productNameAr = item.productNameAr || item.product?.nameAr || productNameEn;
      const productImage =
        item.productImage || item.imageUrl || item.product?.mainImageUrl || item.product?.imageUrl || '';

      return {
        id: itemId,
        productId: productId || itemId,
        cartItemId: cartItemId || undefined,
        productName: productNameEn,
        productNameEn,
        productNameAr,
        productImage,
        price,
        quantity: qty,
        subtotal: Number((price * qty).toFixed(2)),
        selectedColor: item.selectedColor || item.color,
        selectedMaterial: item.selectedMaterial || item.material,
      };
    });

    return this.consolidateCartItems(items);
  }

  /**
   * Syncs the cart with the backend. Merges local items with the backend items consolidating quantities.
   */
  async syncCartFromBackend(): Promise<void> {
    if (!this.authService.isLoggedIn()) {
      return;
    }

    try {
      const backendCart = await firstValueFrom(this.cartApi.getCart());
      const backendItems = this.parseBackendCartItems(backendCart);
      const localItems = this.items();
      const guestItems = localItems.filter((item) => !item.cartItemId);

      if (guestItems.length > 0) {
        const mergePromises = guestItems.map(async (localItem) => {
          const localProductKey = String(localItem.productId || localItem.id || localItem.cartItemId).trim();
          const backendMatch = backendItems.find((bItem) =>
            String(bItem.productId).trim() === localProductKey ||
            String(bItem.id).trim() === localProductKey ||
            String(bItem.cartItemId || '').trim() === localProductKey
          );

          if (backendMatch && backendMatch.cartItemId) {
            const matchId = Number(backendMatch.cartItemId);
            return firstValueFrom(this.cartApi.updateItem(matchId, localItem.quantity));
          }

          const addProductId = Number(localItem.productId || localItem.id || 0);
          return firstValueFrom(this.cartApi.addItem(addProductId, localItem.quantity));
        });

        await Promise.all(mergePromises);
        const latestCart = await firstValueFrom(this.cartApi.getCart());
        this.cartStore.setItems(this.parseBackendCartItems(latestCart));
        return;
      }

      this.cartStore.setItems(backendItems);
    } catch (err) {
      console.error('Error syncing backend cart:', err);
      throw err;
    }
  }

  addToCart(product: IProduct, quantity = 1): Promise<void> {
    const itemId = this.normalizeKey(product.id);
    if (this.loadingStates()[itemId]?.adding) {
      return Promise.resolve();
    }

    this.setItemActionState(itemId, 'adding', true);

    return new Promise<void>((resolve) => {
      setTimeout(async () => {
        try {
          const isAr = this.translationService.currentLang() === 'ar';
          const productTitle = localized(product, 'name', this.translationService.currentLang());

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
          const existingItem = this.findCartItem(itemId);
          const currentQty = existingItem ? existingItem.quantity : 0;
          const newQty = currentQty + quantityToAdd;
          const MAX_STOCK_LIMIT = 10;

          if (newQty > MAX_STOCK_LIMIT) {
            const errorMsg = isAr
              ? `لا يمكن إضافة ${productTitle}. تم الوصول إلى الحد الأقصى للمخزون المتوفر (${MAX_STOCK_LIMIT} قطع).`
              : `Cannot add ${productTitle}. Maximum available stock limit reached (${MAX_STOCK_LIMIT} items).`;
            this.uiState.showAlert('danger', errorMsg);
            resolve();
            return;
          }

          if (existingItem) {
            this.updateLocalCartItem(itemId, (item) => ({
              ...item,
              quantity: item.quantity + quantityToAdd,
              subtotal: Number(((item.quantity + quantityToAdd) * item.price).toFixed(2)),
            }));
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
              subtotal: Number((productPrice * quantityToAdd).toFixed(2)),
            };

            this.items.update((current) => [...current, newItem]);
          }

          const successMsg = isAr
            ? `تمت إضافة ${quantityToAdd} × ${productTitle} إلى سلة التسوق بنجاح.`
            : `Added ${quantityToAdd} × ${productTitle} to your cart successfully.`;
          this.uiState.showAlert('success', successMsg);

          if (this.authService.isAuthenticated()) {
            const matched = this.findCartItem(itemId);
            const cartItemIdVal = matched?.cartItemId;
            const lockKey = `sync-${itemId}`;

            if (this.activeSyncRequests.has(lockKey)) {
              console.log(`Sync request already in progress for item: ${itemId}, skipping duplicate.`);
              resolve();
              return;
            }

            this.activeSyncRequests.add(lockKey);

            const quantityToSync = matched?.quantity ?? newQty;
            const observable = cartItemIdVal
              ? this.cartApi.updateItem(Number(cartItemIdVal), quantityToSync)
              : this.cartApi.addItem(Number(itemId), quantityToAdd);

            const p = observable.toPromise()
              .then((response) => {
                this.applyBackendResponseToLocalState(response);
              })
              .catch((err: any) => {
                console.error('Cart sync failed:', err);
                const warningMsg = isAr
                  ? 'فشلت مزامنة السلة. سيتم المحاولة لاحقاً.'
                  : 'Cart sync failed. Will retry later.';
                this.uiState.showAlert('warning', warningMsg);
              })
              .finally(() => {
                this.activeSyncRequests.delete(lockKey);
                this.pendingUpdatePromises.delete(itemId);
              });

            this.pendingUpdatePromises.set(itemId, p);
          }
        } catch (error) {
          const isAr = this.translationService.currentLang() === 'ar';
          const productTitle = localized(product, 'name', this.translationService.currentLang());
          const errorMsg = isAr
            ? `فشلت إضافة ${productTitle} إلى سلة التسوق. يرجى المحاولة مرة أخرى.`
            : `Failed to add ${productTitle} to your cart. Please try again.`;
          this.uiState.showAlert('danger', errorMsg);
        } finally {
          this.setItemActionState(itemId, 'adding', false);
          resolve();
        }
      }, 600);
    });
  }

  removeFromCart(itemId: string): void {
    const targetId = this.normalizeKey(itemId);
    if (this.isItemPending(targetId)) {
      return;
    }

    const matched = this.findCartItem(targetId);
    if (!matched) {
      return;
    }

    this.setItemActionState(targetId, 'removing', true);
    this.removeLocalCartItem(targetId);

    if (!this.authService.isAuthenticated()) {
      this.setItemActionState(targetId, 'removing', false);
      return;
    }

    const syncTask = (async () => {
      try {
        const resolvedCartItemId = await this.resolveBackendCartItemId(matched);
        if (!resolvedCartItemId) {
          throw new Error('Unable to resolve backend cart item id for removal.');
        }

        console.log('Removing cart item', { id: resolvedCartItemId });
        await firstValueFrom(this.cartApi.removeItem(Number(resolvedCartItemId)));
      } catch (err) {
        console.error('Cart sync failed on item remove:', err);
        const isAr = this.translationService.currentLang() === 'ar';
        const warningMsg = isAr
          ? 'فشلت مزامنة السلة. سيتم المحاولة لاحقاً.'
          : 'Cart sync failed. Will retry later.';
        this.uiState.showAlert('warning', warningMsg);
      } finally {
        this.setItemActionState(targetId, 'removing', false);
        this.pendingUpdatePromises.delete(targetId);
      }
    })();

    this.pendingUpdatePromises.set(targetId, syncTask);
  }

  updateQuantity(itemId: string, quantity: number): void {
    const targetId = this.normalizeKey(itemId);
    const cleanQty = Math.round(Number(quantity));

    if (cleanQty <= 0) {
      this.removeFromCart(targetId);
      return;
    }

    const existing = this.findCartItem(targetId);
    if (!existing || existing.quantity === cleanQty) {
      return;
    }

    this.setItemActionState(targetId, 'updating', true);
    this.updateLocalCartItem(targetId, (item) => ({
      ...item,
      quantity: cleanQty,
      subtotal: Number((item.price * cleanQty).toFixed(2)),
    }));

    if (this.updateQuantityDebounceTimers.has(targetId)) {
      clearTimeout(this.updateQuantityDebounceTimers.get(targetId));
    }

    const timer = setTimeout(async () => {
      this.updateQuantityDebounceTimers.delete(targetId);

      const matched = this.findCartItem(targetId);
      if (!matched) {
        this.setItemActionState(targetId, 'updating', false);
        this.pendingUpdatePromises.delete(targetId);
        return;
      }

      if (!this.authService.isAuthenticated()) {
        this.setItemActionState(targetId, 'updating', false);
        this.pendingUpdatePromises.delete(targetId);
        return;
      }

      try {
        const resolvedCartItemId = await this.resolveBackendCartItemId(matched);
        if (!resolvedCartItemId) {
          throw new Error('Missing backend cartItemId for quantity update.');
        }

        const parsedId = Number(resolvedCartItemId);
        if (isNaN(parsedId)) {
          throw new Error(`Invalid backend cartItemId: ${resolvedCartItemId}`);
        }

        const lockKey = `update-${parsedId}`;
        if (this.activeSyncRequests.has(lockKey)) {
          console.log(`Update request already in progress for cart item ${parsedId}, scheduling final update later.`);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        this.activeSyncRequests.add(lockKey);
        const syncPromise = this.cartApi.updateItem(parsedId, matched.quantity).toPromise()
          .then((response) => {
            this.applyBackendResponseToLocalState(response);
          })
          .catch((err) => {
            console.error('Cart sync failed on quantity update:', err);
            const isAr = this.translationService.currentLang() === 'ar';
            const warningMsg = isAr
              ? 'فشلت مزامنة السلة. سيتم المحاولة لاحقاً.'
              : 'Cart sync failed. Will retry later.';
            this.uiState.showAlert('warning', warningMsg);
          })
          .finally(() => {
            this.activeSyncRequests.delete(lockKey);
            this.setItemActionState(targetId, 'updating', false);
            this.pendingUpdatePromises.delete(targetId);
          });

        this.pendingUpdatePromises.set(targetId, syncPromise);
        await syncPromise;
      } catch (err) {
        console.error('Cart quantity sync failed:', err);
        this.setItemActionState(targetId, 'updating', false);
        this.pendingUpdatePromises.delete(targetId);
      }
    }, 300);

    this.updateQuantityDebounceTimers.set(targetId, timer);
  }

  /**
   * Checks if there are any active or debounced sync operations.
   */
  hasPendingSyncs(): boolean {
    return this.activeSyncRequests.size > 0 || this.updateQuantityDebounceTimers.size > 0;
  }

  /**
   * Returns a promise that resolves when all pending sync requests and debounce timers have completed.
   */
  async awaitPendingSyncs(): Promise<void> {
    // 1. Flush any debounced quantity updates immediately.
    for (const [targetId, timer] of this.updateQuantityDebounceTimers.entries()) {
      clearTimeout(timer);
      this.updateQuantityDebounceTimers.delete(targetId);

      const matched = this.findCartItem(targetId);
      if (!matched || !this.authService.isAuthenticated()) {
        continue;
      }

      try {
        const resolvedCartItemId = await this.resolveBackendCartItemId(matched);
        if (resolvedCartItemId) {
          const parsedId = Number(resolvedCartItemId);
          if (!isNaN(parsedId)) {
            const lockKey = `update-${parsedId}`;
            this.activeSyncRequests.add(lockKey);

            console.log('Forced Updating cart item', { id: parsedId, quantity: matched.quantity });

            const p = this.cartApi.updateItem(parsedId, matched.quantity).toPromise()
              .catch((err) => {
                console.error('Forced cart sync failed:', err);
              })
              .finally(() => {
                this.activeSyncRequests.delete(lockKey);
                this.pendingUpdatePromises.delete(targetId);
              });

            this.pendingUpdatePromises.set(targetId, p);
          }
        }
      } catch (err) {
        console.error('Forced cart sync failed while flushing updates:', err);
      }
    }

    // 2. Await all pending promises
    while (this.pendingUpdatePromises.size > 0 || this.activeSyncRequests.size > 0) {
      const promises = Array.from(this.pendingUpdatePromises.values());
      if (promises.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      await Promise.all(promises);
    }
  }

  clearCart(): void {
    this.cartStore.clear();

    if (this.authService.isLoggedIn()) {
      this.cartApi.clearCart().subscribe({
        next: () => {
          // Sync complete
        },
        error: (err) => {
          console.error('Cart sync failed on cart clear:', err);
        }
      });
    }
  }

  getCart(): ICart {
    return {
      items: this.items(),
      ...this.totals(),
    };
  }

  calculateTotals() {
    return this.totals();
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

