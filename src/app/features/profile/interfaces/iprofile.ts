import { IAddressDto } from './iaddress.dto';

export interface IProfile {
  userId: string;
  userName?: string | null;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  profileImage?: string | null;
  preferredLanguage?: 'en' | 'ar';
  membership?: string;
  addresses: IAddressDto[];
  isGoogleUser?: boolean;
  canEditEmail?: boolean;
  stats?: {
    roomsDesigned?: number;
    productsViewed?: number;
    recommendations?: number;
    stylesExplored?: number;
  };
}
