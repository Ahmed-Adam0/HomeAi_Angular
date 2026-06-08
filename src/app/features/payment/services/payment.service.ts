import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IPaymentIntent, IPaymentMethod, PaymentProvider } from '../interfaces/ipayment';
import { IPaymobPaymentRequest, IPaymobPaymentResponse } from '../interfaces';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants/api-urls';
import { unwrap } from '../../../core/utils/api-utils';

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

  processPayment(transactionId: string): Observable<{ success: boolean; message: string }> {
    return of({ success: true, message: 'Payment authorized successfully.' });
  }
}
