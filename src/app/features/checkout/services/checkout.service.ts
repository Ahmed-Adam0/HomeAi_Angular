import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ICheckoutDetails } from '../interfaces/icheckout';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private http = inject(HttpClient);

  submitCheckout(details: ICheckoutDetails): Observable<{ success: boolean; orderId: string }> {
    const mockOrderId = `ord_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Scaffold dynamic endpoint loading using environment config
    // return this.http.post<{ success: boolean; orderId: string }>(`${environment.apiUrl}checkout`, details);
    return of({ success: true, orderId: mockOrderId });
  }
}
