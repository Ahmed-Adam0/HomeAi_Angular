import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
