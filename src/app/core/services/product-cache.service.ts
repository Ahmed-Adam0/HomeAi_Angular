import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject, map, share, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_URLS } from '../constants';
import { unwrap, normalizeProduct } from '../utils/api-utils';
import { IProduct } from '../../features/products/interfaces/iproduct';

@Injectable({ providedIn: 'root' })
export class ProductCacheService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private cache = new Map<number, IProduct>();
  private inflight = new Map<number, Observable<IProduct>>();

  getProduct(id: number): Observable<IProduct> {
    if (this.cache.has(id)) {
      return of(this.cache.get(id)!);
    }
    if (this.inflight.has(id)) {
      return this.inflight.get(id)!;
    }
    const obs = this.http.get<any>(`${this.apiUrl}${API_URLS.PRODUCTS.DETAILS(id)}`).pipe(
      map((res) => normalizeProduct(unwrap<IProduct>(res))),
      tap((product) => {
        this.cache.set(id, product);
        this.inflight.delete(id);
      }),
      share({ connector: () => new Subject(), resetOnRefCountZero: false }),
    );
    this.inflight.set(id, obs);
    return obs;
  }

  getProducts(ids: number[]): Observable<IProduct[]> {
    const unique = [...new Set(ids)].filter((id) => !isNaN(id) && id > 0);
    if (unique.length === 0) return of([]);
    const observables = unique.map((id) => this.getProduct(id));
    return observables.length === 1
      ? observables[0].pipe(map((p) => [p]))
      : new Observable<IProduct[]>((subscriber) => {
          const results = new Map<number, IProduct>();
          let completed = 0;
          const total = observables.length;
          for (const obs of observables) {
            obs.subscribe({
              next: (product) => {
                const pid = (product as any).id ?? 0;
                results.set(pid, product);
              },
              error: () => {
                completed++;
                if (completed === total) {
                  subscriber.next([...results.values()]);
                  subscriber.complete();
                }
              },
              complete: () => {
                completed++;
                if (completed === total) {
                  subscriber.next([...results.values()]);
                  subscriber.complete();
                }
              },
            });
          }
        });
  }

  clearCache(): void {
    this.cache.clear();
    this.inflight.clear();
  }
}
