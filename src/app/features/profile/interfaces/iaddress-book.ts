import { IShippingAddress } from '../../orders/interfaces/ishipping-address';

export interface IAddressBookEntry extends IShippingAddress {
  id: string;
  label: string; // e.g., 'Home', 'Work', 'Parent\'s House'
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}
