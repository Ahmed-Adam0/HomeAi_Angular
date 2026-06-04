import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OrdersApiService } from '../../orders/data-access/orders-api.service';
import { CartService } from '../../cart/services/cart.service';

export interface ICheckoutItem {
  productId: number;
  quantity: number;
}

export interface ICheckoutPayload {
  address: string;
  phoneNumber: string;
  notes: string | null;
  items?: ICheckoutItem[];
  fullName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  paymentProvider?: 'paymob';
  orderNotes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private ordersApi = inject(OrdersApiService);
  private cartService = inject(CartService);

  submitCheckout(payload: ICheckoutPayload): Observable<{ success: boolean; orderId: string }> {
    return this.ordersApi.createOrder(payload).pipe(
      map((order) => ({
        success: true,
        orderId: order.id
      }))
    );
  }
}
