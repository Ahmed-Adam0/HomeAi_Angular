import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { IProduct } from '../interfaces/iproduct';
import { IProductFilter } from '../interfaces/iproduct-filter';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { unwrap, normalizeProduct } from '../../../core/utils/api-utils';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  readonly products = signal<IProduct[]>([]);

  /**
   * Get all products, matching backend API.
   */
  getProducts(filter?: IProductFilter): Observable<IProduct[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.query) params = params.set('query', filter.query);
      if (filter.categoryId) params = params.set('categoryId', filter.categoryId.toString());
      if (filter.subCategoryId) params = params.set('subCategoryId', filter.subCategoryId.toString());
      if (filter.vendorId) params = params.set('workshopId', filter.vendorId.toString());
      if (filter.minPrice) params = params.set('minPrice', filter.minPrice.toString());
      if (filter.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());
      if (filter.isFeatured !== undefined) params = params.set('isFeatured', filter.isFeatured.toString());
      if (filter.isNewArrival !== undefined) params = params.set('isNewArrival', filter.isNewArrival.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      params = params.set('page', filter.page.toString());
      params = params.set('pageNumber', filter.page.toString());
      params = params.set('limit', filter.limit.toString());
      params = params.set('pageSize', filter.limit.toString());
    }

    return this.http.get<any>(`${this.apiUrl}${API_URLS.PRODUCTS.LIST}`, { params }).pipe(
      map((res) => {
        const unwrapped = unwrap<any>(res);
        const items = Array.isArray(unwrapped) ? unwrapped : (unwrapped && Array.isArray(unwrapped.items) ? unwrapped.items : []);
        return items.map((p: any) => normalizeProduct(p));
      }),
      tap((data: IProduct[]) => {
        if (data) {
          this.products.set(data);
        }
      }),
      catchError((error) => {
        console.error('Products API request failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get single product details by id.
   */
  getProductById(id: string | number): Observable<IProduct> {
    return this.http.get<any>(`${this.apiUrl}${API_URLS.PRODUCTS.DETAILS(id)}`).pipe(
      map(res => normalizeProduct(unwrap<IProduct>(res))),
      catchError((error) => {
        console.error(`Product Details API failed for ID: ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get featured products.
   */
  getFeaturedProducts(): Observable<IProduct[]> {
    const params = new HttpParams().set('isFeatured', 'true');
    return this.http.get<any>(`${this.apiUrl}${API_URLS.PRODUCTS.FEATURED}`, { params }).pipe(
      map((res) => {
        const unwrapped = unwrap<any>(res);
        const items = Array.isArray(unwrapped) ? unwrapped : (unwrapped && Array.isArray(unwrapped.items) ? unwrapped.items : []);
        return items.map((p: any) => normalizeProduct(p));
      }),
      tap((data: IProduct[]) => {
        if (data) {
          this.products.set(data);
        }
      }),
      catchError((error) => {
        console.error('Featured Products API request failed:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Search catalog products by keywords.
   */
  searchProducts(query: string): Observable<IProduct[]> {
    let params = new HttpParams().set('query', query);
    return this.http.get<any>(`${this.apiUrl}${API_URLS.PRODUCTS.SEARCH}`, { params }).pipe(
      map((res) => {
        const unwrapped = unwrap<any>(res);
        const items = Array.isArray(unwrapped) ? unwrapped : (unwrapped && Array.isArray(unwrapped.items) ? unwrapped.items : []);
        return items.map((p: any) => normalizeProduct(p));
      }),
      catchError((error) => {
        console.error(`Search Products API request failed for: ${query}:`, error);
        return throwError(() => error);
      })
    );
  }
}

