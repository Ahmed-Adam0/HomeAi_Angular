import { IAddressDto } from './iaddress.dto';

export interface IUpdateProfileDto {
  fullName: string;
  preferredLanguage: 'en' | 'ar';
  addresses: IAddressDto[];
  email: string | null;
  phoneNumber: string | null;
  profileImage: string | null;
  userName: string | null;
}
