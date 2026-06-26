import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { IProduct, IProductImage } from '../../products/interfaces/iproduct';
import { environment } from '../../../../environments/environment';
import { unwrap, normalizeProduct } from '../../../core/utils/api-utils';

@Injectable({
  providedIn: 'root'
})
export class VendorProductService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Shared signal of products to facilitate easy list refreshes (Requirement 11)
  readonly products = signal<IProduct[]>([]);
  readonly totalCount = signal<number>(0);
  readonly filteredCount = signal<number>(0);
  readonly activeCount = signal<number>(0);
  readonly inactiveCount = signal<number>(0);

  // Pagination Signals
  readonly pageNumber = signal<number>(1);
  readonly pageSize = signal<number>(10);
  readonly totalPages = signal<number>(0);
  readonly hasNextPage = signal<boolean>(false);
  readonly hasPreviousPage = signal<boolean>(false);

  /**
   * Fetch all products owned by the vendor.
   * Targets: GET /api/Products/my-products
   */
  getVendorProducts(
    page: number = 1,
    size: number = 10,
    filters?: {
      search?: string;
      categoryId?: string;
      subCategoryId?: string;
      productTypeId?: string;
      isActive?: boolean;
      sortBy?: string;
    }
  ): Observable<IProduct[]> {
    const params: any = {
      pageNumber: page.toString(),
      pageSize: size.toString()
    };

    if (filters) {
      if (filters.search !== undefined && filters.search !== '') {
        params.search = filters.search;
      }
      if (filters.categoryId !== undefined && filters.categoryId !== '') {
        params.categoryId = filters.categoryId;
      }
      if (filters.subCategoryId !== undefined && filters.subCategoryId !== '') {
        params.subCategoryId = filters.subCategoryId;
      }
      if (filters.productTypeId !== undefined && filters.productTypeId !== '') {
        params.productTypeId = filters.productTypeId;
      }
      if (filters.isActive !== undefined) {
        params.isActive = filters.isActive.toString();
      }
      if (filters.sortBy !== undefined && filters.sortBy !== '') {
        params.sortBy = filters.sortBy;
      }
    }

    return this.http.get<any>(`${this.apiUrl}Products/my-products`, { params }).pipe(
      map(res => {
        // The unwrap() utility digs down and returns only the 'items' array.
        // We need to capture totalCount/activeCount from the level just above it, 
        // or directly from res if it's not nested.
        let metaObj = res;
        if (res && typeof res === 'object') {
          if (res.data && typeof res.data === 'object') metaObj = res.data;
          else if (res.result && typeof res.result === 'object') metaObj = res.result;
        }

        if (metaObj && typeof metaObj === 'object') {
          if (metaObj.totalCount !== undefined) this.totalCount.set(metaObj.totalCount);
          if (metaObj.filteredCount !== undefined) this.filteredCount.set(metaObj.filteredCount);
          if (metaObj.activeCount !== undefined) this.activeCount.set(metaObj.activeCount);
          if (metaObj.inactiveCount !== undefined) this.inactiveCount.set(metaObj.inactiveCount);
          if (metaObj.pageNumber !== undefined) this.pageNumber.set(metaObj.pageNumber);
          if (metaObj.pageSize !== undefined) this.pageSize.set(metaObj.pageSize);
          if (metaObj.totalPages !== undefined) this.totalPages.set(metaObj.totalPages);
          if (metaObj.hasNextPage !== undefined) this.hasNextPage.set(metaObj.hasNextPage);
          if (metaObj.hasPreviousPage !== undefined) this.hasPreviousPage.set(metaObj.hasPreviousPage);
        }

        const unwrapped = unwrap<any>(res);
        let items: any[] = [];
        if (Array.isArray(unwrapped)) {
          items = unwrapped;
        } else if (unwrapped && typeof unwrapped === 'object') {
          for (const key of Object.keys(unwrapped)) {
            if (Array.isArray(unwrapped[key])) {
              items = unwrapped[key];
              break;
            }
          }
        }
        return items.map((p: any) => normalizeProduct(p));
      }),
      tap(data => this.products.set(data))
    );
  }

  /**
   * Fetch details of a single product by ID.
   * Targets: GET /api/Products/my-products/{id}
   */
  getProductById(id: string | number): Observable<IProduct> {
    return this.http.get<any>(`${this.apiUrl}Products/my-products/${id}`).pipe(
      map(res => normalizeProduct(unwrap<IProduct>(res)))
    );
  }

  /**
   * Fetch stats for the vendor products.
   * Targets: GET /api/Products/my-products/stats
   */
  getVendorStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}Products/my-products/stats`).pipe(
      map(res => unwrap<any>(res))
    );
  }

  /**
   * Fetch top products for the vendor.
   * Targets: GET /api/Products/my-products/top
   */
  getTopVendorProducts(): Observable<IProduct[]> {
    return this.http.get<any>(`${this.apiUrl}Products/my-products/top`).pipe(
      map(res => {
        const unwrapped = unwrap<any>(res);
        const items = Array.isArray(unwrapped) ? unwrapped : (unwrapped && Array.isArray(unwrapped.items) ? unwrapped.items : []);
        return items.map((p: any) => normalizeProduct(p));
      })
    );
  }

  /**
   * Create a new product.
   */
  createProduct(product: Partial<IProduct>): Observable<IProduct> {
    return this.http.post<any>(`${this.apiUrl}Products`, product).pipe(
      map(res => normalizeProduct(unwrap<IProduct>(res)))
    );
  }

  /**
   * Update details of an existing product.
   */
  updateProduct(id: string | number, product: Partial<IProduct>): Observable<IProduct> {
    return this.http.put<any>(`${this.apiUrl}Products/${id}`, product).pipe(
      map(res => normalizeProduct(unwrap<IProduct>(res)))
    );
  }

  /**
   * Delete a product permanently.
   */
  deleteProduct(id: string | number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}Products/${id}`);
  }

  /**
   * Uploads a single image using multipart/form-data.
   * Key Requirement: Append ONLY 'file' and let the browser set the boundary automatically.
   */
  uploadImage(productId: string | number, file: File, isPrimary = false): Observable<IProductImage> {
    // Sanitize filename to prevent spaces, parentheses, or special characters causing IIS connection reset
    const sanitizedName = file.name
      .replace(/\s+/g, '_')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    const sanitizedFile = new File([file], sanitizedName, { type: file.type });

    const formData = new FormData();
    formData.append('file', sanitizedFile); // Backend officially standardized key (Requirement 8)

    const url = `${this.apiUrl}Products/${productId}/images?isPrimary=${isPrimary}`;
    return this.http.post<IProductImage>(url, formData);
  }

  /**
   * Uploads multiple selected images sequentially/in parallel using the single-file endpoint.
   * Sets the image corresponding to primaryIndex as primary.
   */
  uploadImages(productId: string | number, files: File[], primaryIndex = -1): Observable<IProductImage[]> {
    if (files.length === 0) {
      return of([]);
    }

    const requests = files.map((file, index) => {
      const isPrimary = index === primaryIndex;
      return this.uploadImage(productId, file, isPrimary);
    });

    return forkJoin(requests);
  }

  /**
   * Delete an image associated with a product.
   */
  deleteImage(productId: string | number, imageId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}Products/${productId}/images/${imageId}`);
  }

  /**
   * Set an image as the primary cover image.
   */
  setPrimaryImage(productId: string | number, imageId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}Products/${productId}/images/${imageId}/primary`, {});
  }

  /**
   * Toggle the active status of a product.
   */
  updateProductStatus(id: string | number, isActive: boolean): Observable<IProduct> {
    const url = `${this.apiUrl}Products/${id}/status`;
    const payload = { isActive };
    console.group('🔄 statusChange Toggle Endpoint Triggered');
    console.log('Request URL:', url);
    console.log('Request Method: PUT');
    console.log('Request Payload:', payload);
    console.groupEnd();
    return this.http.put<IProduct>(url, payload);
  }

  /**
   * Upload a 3D model file associated with a product.
   * Targets: POST /api/Products/{productId}/3d-model
   */
  upload3DModel(productId: string | number, file: File): Observable<{ product3DModelUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ product3DModelUrl: string }>(`${this.apiUrl}Products/${productId}/3d-model`, formData);
  }

  /**
   * Delete the 3D model associated with a product.
   * Targets: DELETE /api/Products/{productId}/3d-model
   */
  delete3DModel(productId: string | number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}Products/${productId}/3d-model`);
  }
}
