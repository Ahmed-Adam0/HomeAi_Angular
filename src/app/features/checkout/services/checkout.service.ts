import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { OrdersApiService } from '../../orders/data-access/orders-api.service';
import { CartService } from '../../cart/services/cart.service';
import { ProfileService } from '../../profile/services/profile.service';
import { IAddressDto } from '../../profile/interfaces/iaddress.dto';

export interface ICheckoutItem {
  productId: number;
  quantity: number;
}

export interface ICheckoutPayload {
  address: string;
  phoneNumber: string;
  notes: string | null;
  items?: ICheckoutItem[];
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  paymentProvider?: 'paymob';
  orderNotes?: string;
  addressId?: string;
}

export interface ICheckoutResult {
  success: boolean;
  orderId: number;
  paymentUrl: string;
  profileAddressSaved: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private ordersApi = inject(OrdersApiService);
  private cartService = inject(CartService);
  private profileService = inject(ProfileService);

  submitCheckout(payload: ICheckoutPayload): Observable<ICheckoutResult> {
    const apiPayload = {
      firstName: payload.firstName ?? '',
      lastName: payload.lastName ?? '',
      email: payload.email ?? '',
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      secondaryAddress: payload.addressLine2 || null,
      notes: payload.notes,
      addressId: payload.addressId || null
    };
    return this.ordersApi.createOrder(apiPayload).pipe(
      switchMap((order) =>
        this.saveAddressToProfile(payload).pipe(
          map((saved) => ({
            success: true,
            orderId: order.id,
            paymentUrl: order.paymentUrl,
            profileAddressSaved: saved,
          }))
        )
      )
    );
  }

  private saveAddressToProfile(payload: ICheckoutPayload): Observable<boolean> {
    const newAddress: IAddressDto = {
      addressLine1: payload.addressLine1?.trim() || '',
      addressLine2: payload.addressLine2?.trim() || '',
      city: payload.city?.trim() || '',
      postalCode: '',
      country: payload.country?.trim() || '',
    };

    if (!newAddress.addressLine1 || !newAddress.city) {
      return of(false);
    }

    return this.profileService.getProfile().pipe(
      switchMap((profile) => {
        const existingAddresses = profile.addresses || [];

        const isDuplicate = existingAddresses.some(
          (addr) =>
            addr.addressLine1?.toLowerCase() === newAddress.addressLine1.toLowerCase() &&
            addr.city?.toLowerCase() === newAddress.city!.toLowerCase() &&
            addr.country?.toLowerCase() === newAddress.country!.toLowerCase()
        );

        if (isDuplicate) {
          return of(true);
        }

        const updatedAddresses = [...existingAddresses, newAddress];

        return this.profileService.updateProfile({
          fullName: profile.fullName,
          preferredLanguage: profile.preferredLanguage || 'en',
          email: profile.email,
          phoneNumber: profile.phoneNumber || null,
          profileImage: profile.profileImage || null,
          userName: profile.userName || null,
          addresses: updatedAddresses,
        }).pipe(
          map(() => true),
          catchError(() => of(false))
        );
      }),
      catchError(() => of(false))
    );
  }
}
