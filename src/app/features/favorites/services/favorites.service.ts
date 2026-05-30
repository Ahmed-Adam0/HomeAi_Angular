import { inject, Injectable, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, forkJoin, of, switchMap, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { IFavoriteItem } from '../interfaces/ifavorite-item';
import { LOCAL_STORAGE_KEYS } from '../../../core/constants/localstorage-keys';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslationService } from '../../../shared/i18n/translation.service';
import { AuthService } from '../../../features/auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private platformId = inject(PLATFORM_ID);
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);

  /** Shared signal — authoritative source for all components */
  readonly favorites = signal<IFavoriteItem[]>([]);

  constructor() {
    effect(() => {
      const loggedIn = this.authService.isAuthenticated();
      if (loggedIn) {
        this.mergeGuestFavorites().subscribe();
      } else {
        if (this.isBrowser) {
          localStorage.removeItem(LOCAL_STORAGE_KEYS.FAVORITES);
        }
        this.favorites.set([]);
      }
    });
  }

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getFavorites(): Observable<IFavoriteItem[]> {
    if (!this.authService.isLoggedIn()) {
      if (!this.isBrowser) {
        return of([]);
      }
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
        if (raw) {
          const parsed = this.parseResponse(JSON.parse(raw));
          this.favorites.set(parsed);
          return of(parsed);
        }
      } catch {}
      this.favorites.set([]);
      return of([]);
    }

    return this.http.get<any>(`${this.apiUrl}Favorites`).pipe(
      map(res => this.parseResponse(res)),
      switchMap(favs => {
        if (!favs || favs.length === 0) {
          return of([]);
        }

        // Check if we need to fetch details (i.e. if any item has price == 0 or empty/null productImage)
        const needsEnrichment = favs.some(fav => !fav.price || !fav.productImage);
        if (!needsEnrichment) {
          return of(favs);
        }

        // Fetch product details for each favorite in parallel
        const requests = favs.map(fav => {
          // If this specific item is already fully populated, return it directly
          if (fav.price && fav.productImage) {
            return of(fav);
          }
          return this.http.get<any>(`${this.apiUrl}Products/${fav.productId}`).pipe(
            map(prod => {
              const price = Number(prod.price || fav.price || 0);
              const salePrice = prod.salePrice ? Number(prod.salePrice) : undefined;
              return {
                ...fav,
                productNameEn: prod.nameEn || fav.productNameEn || fav.productName,
                productNameAr: prod.nameAr || fav.productNameAr || fav.productName,
                productImage: prod.mainImageUrl || prod.imageUrl || fav.productImage || '',
                price,
                salePrice: salePrice !== undefined && salePrice < price ? salePrice : undefined,
                inStock: prod.inStock ?? fav.inStock,
              } as IFavoriteItem;
            }),
            catchError(err => {
              console.error(`Failed to fetch product details for fav product ${fav.productId}:`, err);
              return of(fav);
            })
          );
        });

        return forkJoin(requests);
      }),
      tap(favs => {
        this.favorites.set(favs);
        this.syncToLocalStorage(favs);
      })
    );
  }

  addFavorite(productId: number): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      return this.http.get<any>(`${this.apiUrl}Products/${productId}`).pipe(
        map(prod => {
          const favItem: IFavoriteItem = {
            id: `guest_${productId}_${Date.now()}`,
            productId: String(productId),
            productName: prod.nameEn || prod.name || '',
            productNameEn: prod.nameEn || prod.name || '',
            productNameAr: prod.nameAr || prod.name || '',
            productImage: prod.mainImageUrl || prod.imageUrl || '',
            price: Number(prod.price || 0),
            salePrice: prod.salePrice ? Number(prod.salePrice) : undefined,
            addedAt: new Date().toISOString(),
            inStock: prod.inStock ?? true,
          };
          
          const current = [...this.favorites()];
          if (!current.some(f => Number(f.productId) === productId)) {
            current.push(favItem);
            this.favorites.set(current);
            this.syncToLocalStorage(current);
          }
          return { success: true };
        })
      );
    }

    return this.http.post<any>(`${this.apiUrl}Favorites/${productId}`, {}).pipe(
      tap(() => {
        // Refresh signal from backend after successful add
        this.getFavorites().subscribe();
      })
    );
  }

  removeFavorite(productId: number): Observable<any> {
    if (!this.authService.isLoggedIn()) {
      const updated = this.favorites().filter(f => Number(f.productId) !== productId);
      this.favorites.set(updated);
      this.syncToLocalStorage(updated);
      return of({ success: true });
    }

    return this.http.delete<any>(`${this.apiUrl}Favorites/${productId}`).pipe(
      tap(() => {
        // Optimistic local removal immediately
        const updated = this.favorites().filter(f => Number(f.productId) !== productId);
        this.favorites.set(updated);
        this.syncToLocalStorage(updated);
      })
    );
  }

  /** Check if a product is favorited from shared signal */
  isFavorited(productId: number): boolean {
    return this.favorites().some(f => Number(f.productId) === productId);
  }

  /** Normalize any backend shape to IFavoriteItem[] */
  private parseResponse(res: any): IFavoriteItem[] {
    let raw: any[] = [];

    if (Array.isArray(res)) {
      raw = res;
    } else if (res && Array.isArray(res.items)) {
      raw = res.items;
    } else if (res && Array.isArray(res.data)) {
      raw = res.data;
    } else if (res && Array.isArray(res.value)) {
      raw = res.value;
    } else {
      return [];
    }

    return raw.map(item => {
      // Backend may nest product data inside a `product` object
      const product = item.product ?? item;
      const price =
        Number(item.price ?? item.productPrice ?? product.price ?? product.salePrice ?? 0);
      const salePrice =
        item.salePrice != null ? Number(item.salePrice)
        : product.salePrice != null ? Number(product.salePrice)
        : undefined;

      return {
        id: String(item.id ?? item.favoriteId ?? ''),
        productId: String(item.productId ?? product.id ?? product.productId ?? ''),
        productName: item.productName ?? item.productNameEn ?? product.nameEn ?? product.name ?? '',
        productNameEn: item.productNameEn ?? product.nameEn ?? product.name ?? '',
        productNameAr: item.productNameAr ?? product.nameAr ?? product.name ?? '',
        productImage: item.productImage ?? item.imageUrl ?? product.mainImageUrl ?? product.imageUrl ?? '',
        price,
        salePrice: salePrice !== undefined && salePrice < price ? salePrice : undefined,
        addedAt: item.addedAt ?? item.createdAt ?? new Date().toISOString(),
        inStock: item.inStock ?? product.inStock ?? true,
      } as IFavoriteItem;
    });
  }

  /** Sync to localStorage and dispatch storage event for navbar counter */
  private syncToLocalStorage(favs: IFavoriteItem[]): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITES, JSON.stringify(favs));
      // Dispatch a real StorageEvent so the navbar's @HostListener catches it
      window.dispatchEvent(new StorageEvent('storage', {
        key: LOCAL_STORAGE_KEYS.FAVORITES,
        newValue: JSON.stringify(favs),
      }));
    } catch {}
  }

  mergeGuestFavorites(): Observable<any> {
    if (!this.isBrowser || !this.authService.isLoggedIn()) {
      return of({ success: true });
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
      if (!raw) {
        return of({ success: true });
      }

      const parsed: IFavoriteItem[] = this.parseResponse(JSON.parse(raw));
      const guestItems = parsed.filter(item => item.id && item.id.startsWith('guest_'));
      
      if (guestItems.length === 0) {
        return of({ success: true });
      }

      return this.http.get<any>(`${this.apiUrl}Favorites`).pipe(
        map(res => this.parseResponse(res)),
        switchMap(backendFavs => {
          const backendProductIds = new Set(backendFavs.map(f => Number(f.productId)));
          const itemsToSync = guestItems.filter(item => !backendProductIds.has(Number(item.productId)));

          if (itemsToSync.length === 0) {
            this.syncToLocalStorage(backendFavs);
            return of({ success: true });
          }

          const syncRequests = itemsToSync.map(item => 
            this.http.post<any>(`${this.apiUrl}Favorites/${item.productId}`, {}).pipe(
              catchError(err => {
                console.error(`Failed to sync guest favorite ${item.productId}:`, err);
                return of(null);
              })
            )
          );

          return forkJoin(syncRequests).pipe(
            switchMap(() => {
              return this.getFavorites().pipe(
                tap(finalFavs => {
                  this.syncToLocalStorage(finalFavs);
                })
              );
            })
          );
        })
      );
    } catch (e) {
      console.error('Failed to merge guest favorites:', e);
      return of({ success: false });
    }
  }
}
