import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { IPaymentIntent, IPaymentMethod, PaymentProvider } from '../interfaces/ipayment';
import { IPaymobPaymentRequest, IPaymobPaymentResponse } from '../interfaces';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants/api-urls';
import { unwrap } from '../../../core/utils/api-utils';

export interface IInitiateMasterOrderPaymentRequest {
  masterOrderId: number;
}

export interface IInitiateMasterOrderPaymentResponse {
  paymentUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private http = inject(HttpClient);

  // Payment Overlay State
  readonly isOverlayVisible = signal<boolean>(false);
  readonly paymentUrl = signal<string | null>(null);
  readonly orderId = signal<number | null>(null);
  readonly isIframeLoading = signal<boolean>(true);

  private paymentResult$ = new Subject<{ success: boolean; orderId: number }>();

  startPaymentFlow(paymentUrl: string, orderId: number): Observable<{ success: boolean; orderId: number }> {
    this.paymentUrl.set(paymentUrl);
    this.orderId.set(orderId);
    this.isIframeLoading.set(true);
    this.isOverlayVisible.set(true);

    // Recreate subject for clean state handling per payment attempt
    this.paymentResult$ = new Subject<{ success: boolean; orderId: number }>();
    return this.paymentResult$.asObservable();
  }

  completePayment(success: boolean): void {
    const currentOrderId = this.orderId() || 0;
    this.isOverlayVisible.set(false);
    this.paymentUrl.set(null);
    this.orderId.set(null);
    this.paymentResult$.next({ success, orderId: currentOrderId });
    this.paymentResult$.complete();
  }

  cancelPayment(): void {
    const currentOrderId = this.orderId() || 0;
    this.isOverlayVisible.set(false);
    this.paymentUrl.set(null);
    this.orderId.set(null);
    this.paymentResult$.next({ success: false, orderId: currentOrderId });
    this.paymentResult$.complete();
  }

  readonly paymentMethods = signal<IPaymentMethod[]>([
    { id: 'str_card', name: 'Credit/Debit Card (Stripe)', provider: 'stripe', icon: '💳', enabled: true },
    { id: 'pp_wallet', name: 'PayPal Wallet', provider: 'paypal', icon: '🅿️', enabled: true },
    { id: 'pm_wallet', name: 'Mobile Wallet (Paymob)', provider: 'paymob', icon: '📱', enabled: true }
  ]);

  createPaymentIntent(amount: number, currency: string, provider: PaymentProvider): Observable<IPaymentIntent> {
    const mockIntent: IPaymentIntent = {
      transactionId: `tx_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      currency,
      status: 'pending',
      provider,
      clientSecret: `sec_${Math.random().toString(36).substr(2, 12)}`
    };
    
    // Scaffold dynamic endpoint loading using environment config
    // return this.http.post<IPaymentIntent>(`${environment.apiUrl}payment/intent`, { amount, currency, provider });
    return of(mockIntent);
  }

  createPaymobPayment(payload: IPaymobPaymentRequest): Observable<IPaymobPaymentResponse> {
    return this.http.post<IPaymobPaymentResponse>(
      `${environment.apiUrl}${API_URLS.PAYMENTS.PAYMOB}`,
      payload
    ).pipe(map((res) => unwrap<IPaymobPaymentResponse>(res)));
  }

  initiateMasterOrderPayment(payload: IInitiateMasterOrderPaymentRequest): Observable<IInitiateMasterOrderPaymentResponse> {
    return this.http.post<IInitiateMasterOrderPaymentResponse>(
      `${environment.apiUrl}${API_URLS.PAYMENTS.INITIATE_MASTERORDER}`,
      payload
    ).pipe(map((res) => unwrap<IInitiateMasterOrderPaymentResponse>(res)));
  }

  initiateVendorOrderPayment(payload: { vendorOrderId: number }): Observable<{ paymentUrl: string }> {
    return this.http.post<{ paymentUrl: string }>(
      `${environment.apiUrl}${API_URLS.PAYMENTS.INITIATE_VENDORORDER}`,
      payload
    ).pipe(map((res) => unwrap<{ paymentUrl: string }>(res)));
  }

  getMasterOrderRemainingBalance(masterOrderId: number | string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}${API_URLS.PAYMENTS.MASTERORDER_REMAINING_BALANCE(masterOrderId)}`
    ).pipe(map((res) => unwrap<any>(res)));
  }

  getVendorOrderRemainingBalance(vendorOrderId: number | string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}${API_URLS.PAYMENTS.VENDORORDER_REMAINING_BALANCE(vendorOrderId)}`
    ).pipe(map((res) => unwrap<any>(res)));
  }

  processPayment(transactionId: string): Observable<{ success: boolean; message: string }> {
    return of({ success: true, message: 'Payment authorized successfully.' });
  }
}
