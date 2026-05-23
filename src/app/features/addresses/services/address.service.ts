import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface IAddress {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private initialAddresses: IAddress[] = [
    { id: 'addr_1', label: 'Home', fullName: 'Mayar Ahmed', street: '123 Nile St', city: 'Cairo', zipCode: '11511', country: 'Egypt', isDefault: true },
    { id: 'addr_2', label: 'Office', fullName: 'Mayar Ahmed', street: '456 Smart Village', city: 'Giza', zipCode: '12577', country: 'Egypt', isDefault: false }
  ];

  readonly addresses = signal<IAddress[]>(this.initialAddresses);

  getAddresses(): Observable<IAddress[]> {
    return of(this.addresses());
  }

  addAddress(address: Omit<IAddress, 'id'>): void {
    const newAddress = {
      ...address,
      id: `addr_${Math.random().toString(36).substr(2, 9)}`
    };
    if (newAddress.isDefault) {
      this.addresses.update((list) =>
        list.map((a) => ({ ...a, isDefault: false })).concat(newAddress)
      );
    } else {
      this.addresses.update((list) => list.concat(newAddress));
    }
  }

  deleteAddress(id: string): void {
    this.addresses.update((list) => list.filter((a) => a.id !== id));
  }
}
