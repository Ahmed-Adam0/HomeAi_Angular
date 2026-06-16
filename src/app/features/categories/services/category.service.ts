import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ICategory } from '../interfaces/icategory';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);

  readonly categories = signal<ICategory[]>([]);

  getCategories(): Observable<ICategory[]> {
    return this.http.get<ICategory[]>(`${environment.apiUrl}${API_URLS.PRODUCTS.CATEGORIES}`).pipe(
      tap((data) => {
        if (data) {
          this.categories.set(data);
        }
      }),
      catchError((error) => {
        console.error('Categories API request failed:', error);
        return throwError(() => error);
      })
    );
  }

  getSubcategories(categoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}${API_URLS.PRODUCTS.SUBCATEGORIES(categoryId)}`).pipe(
      catchError((error) => {
        console.error(`Subcategories API request failed for category ${categoryId}:`, error);
        return throwError(() => error);
      })
    );
  }

  getProductTypes(subCategoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}${API_URLS.PRODUCTS.PRODUCT_TYPES(subCategoryId)}`).pipe(
      catchError((error) => {
        console.error(`ProductTypes API request failed for subcategory ${subCategoryId}:`, error);
        return throwError(() => error);
      })
    );
  }
}
