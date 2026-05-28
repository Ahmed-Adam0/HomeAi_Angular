import { Injectable, computed, inject, PLATFORM_ID, signal, effect } from '@angular/core';
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
import { Observable } from 'rxjs';

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

      effect(() => {
        if (this.authService.isAuthenticated()) {
          this.syncCartFromBackend();
        } else {
          this.cartStore.clear();
        }
      });
    }
  }

  /**
   * Safely map raw backend response to frontend ICartItem[] structure defensively.
   */
  private parseBackendCartItems(response: any): ICartItem[] {
    console.log('Backend cart response', response);
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

    return rawItems.map((item: any) => {
      const rawCartItemId = item.cartItemId ?? item.cartItemID ?? item.itemId ?? '';
      const productIdFromProduct = item.product?.id ?? item.product?.productId;
      const rawProductId = item.productId ?? productIdFromProduct ?? '';
      const rawId = item.id ?? '';

      const normalizedCartItemId = String(rawCartItemId).trim();
      const normalizedProductId = String(rawProductId).trim();
      const normalizedId = String(rawId).trim();

      console.log('Raw backend cart item', item);

      let cartItemId = normalizedCartItemId;
      if (!cartItemId && normalizedId && normalizedId !== normalizedProductId) {
        cartItemId = normalizedId;
      }

      let productId = normalizedProductId;
      if (!productId && normalizedId && normalizedId !== cartItemId) {
        productId = normalizedId;
      }

      const itemId = productId || cartItemId || normalizedId;
      const qty = Math.max(1, Math.round(Number(item.quantity) || 1));
      const price = Math.max(0, Number(item.price || item.product?.price || 0));

      const productNameEn = item.productNameEn || item.productName || item.product?.nameEn || item.product?.name || '';
      const productNameAr = item.productNameAr || item.product?.nameAr || productNameEn;
      const productImage = item.productImage || item.imageUrl || item.product?.mainImageUrl || item.product?.imageUrl || '';

      return {
        id: itemId,
        productId,
        cartItemId,
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
  }

  /**
   * Syncs the cart with the backend. Merges local items with the backend items consolidating quantities.
   */
  syncCartFromBackend(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.authService.isLoggedIn()) {
        resolve();
        return;
      }

      this.cartApi.getCart().subscribe({
        next: (backendCart) => {
          const backendItems = this.parseBackendCartItems(backendCart);
          const localItems = this.items();
          const guestItems = localItems.filter((item) => !item.cartItemId);

          if (guestItems.length > 0) {
            // Merge only unsynced guest items to backend cart
            const mergePromises = guestItems.map((localItem) => {
              const backendMatch = backendItems.find(
                (bItem) => String(bItem.productId) === String(localItem.productId)
              );

              if (backendMatch && backendMatch.cartItemId) {
                const newQuantity = backendMatch.quantity + localItem.quantity;
                const matchId = Number(backendMatch.cartItemId);
                return this.cartApi.updateItem(matchId, newQuantity).toPromise();
              } else {
                return this.cartApi.addItem(Number(localItem.productId), localItem.quantity).toPromise();
              }
            });

            Promise.all(mergePromises)
              .then(() => {
                // Reload backend cart again to get the single-source-of-truth state
                this.cartApi.getCart().subscribe({
                  next: (latestCart) => {
                    const finalItems = this.parseBackendCartItems(latestCart);
                    this.cartStore.setItems(finalItems);
                    resolve();
                  },
                  error: (err) => {
                    console.error('Error reloading cart after merge:', err);
                    reject(err);
                  }
                });
              })
              .catch((err) => {
                console.error('Error merging local cart into backend:', err);
                this.cartStore.setItems(backendItems);
                reject(err);
              });
          } else {
            // No guest items to merge, just hydrate from backend directly
            this.cartStore.setItems(backendItems);
            resolve();
          }
        },
        error: (err) => {
          console.error('Error fetching backend cart:', err);
          reject(err);
        }
      });
    });
  }

  addToCart(product: IProduct, quantity = 1): Promise<void> {
    const itemId = product.id.toString().trim();
    if (this.loadingStates()[itemId]?.adding) {
      return Promise.resolve();
    }

    this.setItemActionState(itemId, 'adding', true);

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
              String(item.productId).trim() === itemId ||
              String(item.cartItemId || '').trim() === itemId
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
                String(item.productId).trim() === itemId ||
                String(item.cartItemId || '').trim() === itemId
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

          // 4. Background Sync
          if (this.authService.isAuthenticated()) {
            const matched = this.items().find(
              (i) =>
                String(i.id).trim() === itemId ||
                String(i.productId).trim() === itemId ||
                String(i.cartItemId || '').trim() === itemId
            );
            const cartItemIdVal = matched?.cartItemId;
            const lockKey = `sync-${itemId}`;

            if (this.activeSyncRequests.has(lockKey)) {
              console.log(`Sync request already in progress for item: ${itemId}, skipping duplicate.`);
              resolve();
              return;
            }
            this.activeSyncRequests.add(lockKey);

            const handleSyncObservable = (obs: Observable<any>, payloadLog: any) => {
              console.log('Updating cart item', payloadLog);
              const p = obs.toPromise()
                .then(() => {
                  this.activeSyncRequests.delete(lockKey);
                  this.syncCartFromBackend();
                })
                .catch((err: any) => {
                  this.activeSyncRequests.delete(lockKey);
                  console.error('Cart sync failed:', err);
                  const warningMsg = isAr
                    ? 'فشلت مزامنة السلة. سيتم المحاولة لاحقاً.'
                    : 'Cart sync failed. Will retry later.';
                  this.uiState.showAlert('warning', warningMsg);
                })
                .finally(() => {
                  this.pendingUpdatePromises.delete(itemId);
                });
              this.pendingUpdatePromises.set(itemId, p);
            };

            if (matched && cartItemIdVal) {
              const newQtyVal = matched.quantity;
              handleSyncObservable(
                this.cartApi.updateItem(Number(cartItemIdVal), newQtyVal),
                { id: Number(cartItemIdVal), quantity: newQtyVal }
              );
            } else {
              handleSyncObservable(
                this.cartApi.addItem(Number(itemId), quantityToAdd),
                { productId: itemId, quantity: quantityToAdd }
              );
            }
          }
        } catch (error) {
          // 5. Failed Add Action Check
          const isAr = this.translationService.currentLang() === 'ar';
          const productTitle = isAr ? product.nameAr : product.nameEn;
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
    const targetId = itemId.trim();
    if (this.isItemPending(targetId)) {
      return;
    }

    this.setItemActionState(targetId, 'removing', true);

    const matched = this.items().find(
      (i) =>
        String(i.id).trim() === targetId ||
        String(i.productId).trim() === targetId ||
        String(i.cartItemId || '').trim() === targetId
    );
    const cartItemIdVal = matched?.cartItemId;

    if (!cartItemIdVal) {
      console.error('Missing cartItemId', matched || { targetId });
      this.setItemActionState(targetId, 'removing', false);
      return;
    }

    // 1. Optimistic removal
    this.items.update((current) =>
      current.filter(
        (item) =>
          String(item.id).trim() !== targetId &&
          String(item.productId).trim() !== targetId &&
          String(item.cartItemId || '').trim() !== targetId
      )
    );
    this.setItemActionState(targetId, 'removing', false);

    // 2. Background sync
    if (this.authService.isAuthenticated()) {
      console.log('Removing cart item', { id: cartItemIdVal });
      const p = this.cartApi.removeItem(cartItemIdVal).toPromise()
        .then(() => {
          this.syncCartFromBackend();
        })
        .catch((err) => {
          console.error('Cart sync failed on item remove:', err);
          const isAr = this.translationService.currentLang() === 'ar';
          const warningMsg = isAr
            ? 'فشلت مزامنة السلة. سيتم المحاولة لاحقاً.'
            : 'Cart sync failed. Will retry later.';
          this.uiState.showAlert('warning', warningMsg);
        })
        .finally(() => {
          this.pendingUpdatePromises.delete(targetId);
        });
      this.pendingUpdatePromises.set(targetId, p);
    }
  }

  updateQuantity(itemId: string, quantity: number): void {
    const targetId = itemId.trim();
    if (this.isItemPending(targetId)) {
      return;
    }

    const cleanQty = Math.round(Number(quantity));
    if (isNaN(cleanQty) || cleanQty <= 0) {
      this.removeFromCart(targetId);
      return;
    }

    this.setItemActionState(targetId, 'updating', true);

    // 1. Optimistic update
    this.items.update((current) =>
      current.map((item) =>
        String(item.id).trim() === targetId ||
        String(item.productId).trim() === targetId ||
        String(item.cartItemId || '').trim() === targetId
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

    setTimeout(() => {
      this.setItemActionState(targetId, 'updating', false);
    }, 180);

    // 2. Background sync
    if (this.authService.isAuthenticated()) {
      if (this.updateQuantityDebounceTimers.has(targetId)) {
        clearTimeout(this.updateQuantityDebounceTimers.get(targetId));
      }

      const timer = setTimeout(() => {
        this.updateQuantityDebounceTimers.delete(targetId);

        const matched = this.items().find(
          (i) =>
            String(i.id).trim() === targetId ||
            String(i.productId).trim() === targetId ||
            String(i.cartItemId || '').trim() === targetId
        );
        if (!matched) return;

        if (!matched.cartItemId) {
          console.error('Missing cartItemId', matched);
          this.pendingUpdatePromises.delete(targetId);
          return;
        }

        const parsedId = Number(matched.cartItemId);
        if (isNaN(parsedId)) {
          console.error('Invalid cartItemId for update', matched.cartItemId, matched);
          this.pendingUpdatePromises.delete(targetId);
          return;
        }

        const lockKey = `update-${parsedId}`;
        if (this.activeSyncRequests.has(lockKey)) {
          console.log(`Update request in progress for cart item ${parsedId}, skipping sync until previous completes.`);
          return;
        }

        this.activeSyncRequests.add(lockKey);
        const payload = { id: parsedId, quantity: matched.quantity };
        console.log('Cart item before update', matched);
        console.log('PUT payload', payload);

        const syncPromise = this.cartApi.updateItem(parsedId, matched.quantity).toPromise()
          .then(() => {
            this.activeSyncRequests.delete(lockKey);
            this.syncCartFromBackend();
          })
          .catch((err) => {
            this.activeSyncRequests.delete(lockKey);
            console.error('Cart sync failed on quantity update:', err);
            const isAr = this.translationService.currentLang() === 'ar';
            const warningMsg = isAr
              ? 'فشلت مزامنة السلة. سيتم المحاولة لاحقاً.'
              : 'Cart sync failed. Will retry later.';
            this.uiState.showAlert('warning', warningMsg);
          })
          .finally(() => {
            this.pendingUpdatePromises.delete(targetId);
          });

        this.pendingUpdatePromises.set(targetId, syncPromise);
      }, 300); // 300ms debounce

      this.updateQuantityDebounceTimers.set(targetId, timer);
    }
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
    // 1. Force execution of any debounced timers immediately to start their request
    for (const [targetId, timer] of this.updateQuantityDebounceTimers.entries()) {
      clearTimeout(timer);
      this.updateQuantityDebounceTimers.delete(targetId);

      const matched = this.items().find(
        (i) =>
          String(i.id).trim() === targetId ||
          String(i.productId).trim() === targetId ||
          String(i.cartItemId || '').trim() === targetId
      );
      if (matched && matched.cartItemId) {
        const parsedId = Number(matched.cartItemId);
        if (!isNaN(parsedId)) {
          const lockKey = `update-${parsedId}`;
          this.activeSyncRequests.add(lockKey);

          console.log('Forced Updating cart item', { id: parsedId, quantity: matched.quantity });

          const p = this.cartApi.updateItem(parsedId, matched.quantity).toPromise()
            .then(() => {
              this.activeSyncRequests.delete(lockKey);
              this.syncCartFromBackend();
            })
            .catch((err) => {
              this.activeSyncRequests.delete(lockKey);
              console.error('Forced cart sync failed:', err);
            })
            .finally(() => {
              this.pendingUpdatePromises.delete(targetId);
            });
          this.pendingUpdatePromises.set(targetId, p);
        }
      }
    }

    // 2. Await all pending promises
    while (this.pendingUpdatePromises.size > 0 || this.activeSyncRequests.size > 0) {
      const promises = Array.from(this.pendingUpdatePromises.values());
      if (promises.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
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

