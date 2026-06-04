import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { IOrder, IBackendOrder, IBackendOrderItem } from '../interfaces';
import { mapBackendToOrder } from './orders.mapper';

type ApiEnvelope<T> = T | { data: T } | { result: T };

type ApiArrayEnvelope<T> = T[] | { data: T[] } | { result: T[] } | { items: T[] };

function unwrapApiResponse<T>(value: ApiEnvelope<T>): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if ('data' in v) return v['data'] as T;
    if ('result' in v) return v['result'] as T;
  }
  return value as T;
}

function unwrapApiArrayResponse<T>(value: ApiArrayEnvelope<T>): T[] {
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if ('data' in v) return v['data'] as T[];
    if ('result' in v) return v['result'] as T[];
    if ('items' in v) return v['items'] as T[];
  }
  return value as T[];
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
      .get<ApiArrayEnvelope<IBackendOrder>>(`${this.apiUrl}${API_URLS.ORDERS.LIST}`)
      .pipe(
        map(unwrapApiArrayResponse),
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
        map(unwrapApiResponse),
        tap((response) => console.log('Backend order response inside API service:', response)),
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
        map(unwrapApiResponse),
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
        map(unwrapApiResponse),
        map(mapBackendToOrder)
      );
  }

  /**
   * Updates items (quantities) on an existing pending order.
   */
  updateOrderItems(id: string | number, items: { productId: number; quantity: number }[]): Observable<IOrder> {
    return this.http
      .put<ApiEnvelope<IBackendOrder>>(`${this.apiUrl}${API_URLS.ORDERS.UPDATE_ITEMS(id)}`, { items })
      .pipe(
        map(unwrapApiResponse),
        map(mapBackendToOrder)
      );
  }
}
