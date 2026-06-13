export interface IVendorWorkshopAddressDto {
  city: string | null;
  area: string | null;
  street: string | null;
  buildingNumber: string | null;
  notes: string | null;
}

export interface IVendorProfileResponseDto {
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  preferredLanguage: string;
  workshopNameAr: string | null;
  workshopNameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  workshopAddress: IVendorWorkshopAddressDto;
  logoUrl?: string | null;
  profileImage?: string | null;
}
