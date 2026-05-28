import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { IOrder, IBackendOrder } from '../interfaces';
import { mapBackendToOrder } from './orders.mapper';

type ApiEnvelope<T> = T | { data: T } | { result: T } | { items: T };

function unwrap<T>(value: ApiEnvelope<T>): T {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if ('data' in v) return v['data'] as T;
    if ('result' in v) return v['result'] as T;
    if ('items' in v) return v['items'] as T;
  }
  return value as T;
}

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Fetches the orders list for the currently logged-in user.
   * Maps raw BackendOrder[] to frontend IOrder[].
   */
  getMyOrders(): Observable<IOrder[]> {
    return this.http
      .get<ApiEnvelope<IBackendOrder[]>>(`${this.apiUrl}${API_URLS.ORDERS.LIST}`)
      .pipe(
        map(unwrap),
        map((orders) => (orders || []).map(mapBackendToOrder))
      );
  }

  /**
   * Fetches detailed information for a single order.
   * Maps raw BackendOrder to frontend IOrder.
   */
  getOrderById(id: string | number): Observable<IOrder> {
    return this.http
      .get<ApiEnvelope<IBackendOrder>>(`${this.apiUrl}${API_URLS.ORDERS.DETAILS(id)}`)
      .pipe(
        map(unwrap),
        map(mapBackendToOrder)
      );
  }

  /**
   * Submits a checkout payload to create a new order on the backend.
   * Maps the returned BackendOrder to IOrder.
   */
  createOrder(payload: any): Observable<IOrder> {
    return this.http
      .post<ApiEnvelope<IBackendOrder>>(`${this.apiUrl}${API_URLS.ORDERS.CREATE}`, payload)
      .pipe(
        map(unwrap),
        map(mapBackendToOrder)
      );
  }

  /**
   * Updates an order's status in the backend.
   */
  updateOrderStatus(id: string | number, status: string): Observable<IOrder> {
    return this.http
      .put<ApiEnvelope<IBackendOrder>>(`${this.apiUrl}${API_URLS.ORDERS.UPDATE_STATUS(id)}`, { status })
      .pipe(
        map(unwrap),
        map(mapBackendToOrder)
      );
  }
}
