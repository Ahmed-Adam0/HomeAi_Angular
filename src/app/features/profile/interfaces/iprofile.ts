import { IAddressBookEntry } from './iaddress-book';

export interface IUserPreferences {
  theme: 'light' | 'dark' | 'system';
  marketingEmails: boolean;
  orderUpdates: boolean;
  recommendations: boolean;
}

export interface IProfile {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  addresses: IAddressBookEntry[];
  preferences: IUserPreferences;
  registeredAt: string;
}
