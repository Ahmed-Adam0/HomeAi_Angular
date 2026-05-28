import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ICheckoutDetails } from '../interfaces/icheckout';
import { environment } from '../../../../environments/environment';
import { OrdersApiService } from '../../orders/data-access/orders-api.service';
import { CartService } from '../../cart/services/cart.service';

export interface ICheckoutPayload {
  address: string;
  phoneNumber: string;
  notes: string | null;
}

export interface ICouponValidationResult {
  valid: boolean;
  discountAmount: number;
  messageKey: string;
  savedAmountKey?: string;
  couponCode?: string;
  discountType?: string;
}

export interface ICouponTotalsContext {
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  total: number;
}

interface ICouponValidationApiRequest {
  code: string;
  subtotal: number;
}

interface ICouponValidationApiResponse {
  valid: boolean;
  couponCode?: string;
  discountType?: 'percentage' | 'fixed' | 'shipping' | string;
  discountAmount?: number;
  messageKey: string;
  savedAmountKey?: string;
}

interface ICouponValidationApiError {
  messageKey?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private http = inject(HttpClient);
  private ordersApi = inject(OrdersApiService);
  private cartService = inject(CartService);

  /**
   * Submits a checkout payload to create a new order on the backend.
   */
  submitCheckout(payload: ICheckoutPayload): Observable<{ success: boolean; orderId: string }> {
    return this.ordersApi.createOrder(payload).pipe(
      map((order) => ({
        success: true,
        orderId: order.id
      }))
    );
  }

  validateCoupon(code: string, totals: ICouponTotalsContext): Observable<ICouponValidationResult> {
    const couponCode = String(code || '').trim();

    if (!couponCode) {
      return of({
        valid: false,
        discountAmount: 0,
        messageKey: 'CHECKOUT_COUPON_REQUIRED',
      });
    }

    const requestPayload: ICouponValidationApiRequest = {
      code: couponCode,
      subtotal: totals.subtotal,
    };

    return this.http.post<ICouponValidationApiResponse>(
      `${environment.apiUrl}coupons/validate`,
      requestPayload
    ).pipe(
      map((response) => this.mapApiResponseToResult(response, couponCode)),
      catchError((error: HttpErrorResponse) => of(this.mapApiErrorToResult(error)))
    );
  }

  private mapApiResponseToResult(
    response: ICouponValidationApiResponse,
    requestCode: string
  ): ICouponValidationResult {
    return {
      valid: response.valid === true,
      discountAmount: response.discountAmount ?? 0,
      messageKey: response.messageKey || (response.valid ? 'CHECKOUT_COUPON_APPLIED' : 'CHECKOUT_COUPON_INVALID'),
      couponCode: response.couponCode ?? requestCode,
      discountType: response.discountType,
      savedAmountKey: response.savedAmountKey,
    };
  }

  private mapApiErrorToResult(error: HttpErrorResponse): ICouponValidationResult {
    const backendPayload = this.safeParseApiError(error);
    const messageKey = backendPayload.messageKey
      || this.getFallbackMessageKey(error.status);

    return {
      valid: false,
      discountAmount: 0,
      messageKey,
    };
  }

  private safeParseApiError(error: HttpErrorResponse): ICouponValidationApiError {
    if (!error || !error.error || typeof error.error !== 'object') {
      return {};
    }

    return error.error as ICouponValidationApiError;
  }

  private getFallbackMessageKey(status: number): string {
    if (status === 0) {
      return 'CHECKOUT_COUPON_NETWORK_ERROR';
    }

    if (status === 400 || status === 422) {
      return 'CHECKOUT_COUPON_INVALID';
    }

    if (status === 409) {
      return 'CHECKOUT_COUPON_DUPLICATE';
    }

    if (status === 412) {
      return 'CHECKOUT_COUPON_MINIMUM_ORDER';
    }

    return 'CHECKOUT_COUPON_GENERIC_ERROR';
  }
}
