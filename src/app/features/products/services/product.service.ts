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
   * Get paginated products with metadata, matching backend API structures.
   */
  getProductsPaginated(filter?: IProductFilter): Observable<{ totalItems: number; data: IProduct[] }> {
    let params = new HttpParams();

    if (filter) {
      if (filter.query) {
        params = params.set('query', filter.query);
        params = params.set('search', filter.query);
      }
      if (filter.categoryId) params = params.set('categoryId', filter.categoryId.toString());
      if (filter.subCategoryId) params = params.set('subCategoryId', filter.subCategoryId.toString());
      if (filter.vendorId) params = params.set('workshopId', filter.vendorId.toString());
      if (filter.minPrice) params = params.set('minPrice', filter.minPrice.toString());
      if (filter.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      
      params = params.set('page', filter.page.toString());
      params = params.set('pageNumber', filter.page.toString());
      params = params.set('limit', filter.limit.toString());
      params = params.set('pageSize', filter.limit.toString());
    }

    return this.http.get<any>(`${this.apiUrl}${API_URLS.PRODUCTS.LIST}`, { params }).pipe(
      map((res) => {
        const totalKeys: string[] = [
          'totalItems', 'totalCount', 'total', 'count',
          'recordsTotal', 'totalRecords', 'recordCount',
          'itemCount', 'itemsCount', 'total_size',
          'totalitems', 'totalcount', 'total_records',
          'total_results', 'totalresult', 'totalResult',
          'totalRecordsCount', 'datosLength',
          'iTotalRecords', 'iTotalDisplayRecords'
        ];

        function extractTotal(obj: any): number {
          if (!obj || typeof obj !== 'object') return 0;
          for (const key of totalKeys) {
            if (key in obj && typeof obj[key] === 'number') return obj[key];
          }
          if (obj.pagination && typeof obj.pagination === 'object') {
            for (const key of totalKeys) {
              if (key in obj.pagination && typeof obj.pagination[key] === 'number') return obj.pagination[key];
            }
          }
          return 0;
        }

        function extractItems(obj: any): any[] {
          if (!obj || typeof obj !== 'object') return [];
          if (Array.isArray(obj.data)) return obj.data;
          if (Array.isArray(obj.items)) return obj.items;
          if (Array.isArray(obj.records)) return obj.records;
          if (Array.isArray(obj.results)) return obj.results;
          if (Array.isArray(obj.rows)) return obj.rows;
          if (Array.isArray(obj.products)) return obj.products;
          if (Array.isArray(obj.result)) return obj.result;
          return [];
        }

        let items: any[] = [];
        let totalItems = 0;

        if (Array.isArray(res)) {
          items = res;
          totalItems = res.length;
        } else if (res && typeof res === 'object') {
          // Handle { result: { ... } } wrapper
          const inner = 'result' in res ? res.result : res;

          if (inner && typeof inner === 'object') {
            totalItems = extractTotal(inner);
            items = extractItems(inner);

            // If items not found at top level, check inside 'data' object wrapper
            if (items.length === 0 && inner.data && typeof inner.data === 'object' && !Array.isArray(inner.data)) {
              if (!totalItems) totalItems = extractTotal(inner.data);
              items = extractItems(inner.data);
            }

            // If still no items but inner is an array itself
            if (items.length === 0 && Array.isArray(inner)) {
              items = inner;
            }
          }
        }

        return {
          totalItems: totalItems || items.length,
          data: items.map((p: any) => normalizeProduct(p))
        };
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

