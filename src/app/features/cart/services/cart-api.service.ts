import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';

@Injectable({
  providedIn: 'root',
})
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Fetch the backend cart session.
   */
  getCart(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}${API_URLS.CART.GET}`);
  }

  /**
   * Add a product/item to the backend cart.
   */
  addItem(productId: number, quantity: number, selectedOptionIds: number[] = []): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}${API_URLS.CART.ADD_ITEM}`, {
      productId,
      quantity,
      selectedOptionIds,
    });
  }

  /**
   * Update an item's quantity in the backend cart.
   * API: PUT /api/Cart/items — body: { cartItemId, quantity }
   */
  updateItem(cartItemId: number, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}${API_URLS.CART.UPDATE_ITEM}`, {
      cartItemId,
      quantity,
    });
  }

  /**
   * Remove an item from the backend cart by its ID (cart item ID).
   */
  removeItem(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}${API_URLS.CART.REMOVE_ITEM(id)}`);
  }

  /**
   * Clear the backend cart.
   */
  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}${API_URLS.CART.CLEAR}`);
  }
}
