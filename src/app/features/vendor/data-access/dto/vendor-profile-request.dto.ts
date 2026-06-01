export interface IVendorWorkshopAddressRequestDto {
  city: string | null;
  area: string | null;
  street: string | null;
  buildingNumber: string | null;
  notes: string | null;
}

export interface IVendorProfileRequestDto {
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  preferredLanguage: string;
  workshopNameAr: string | null;
  workshopNameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  workshopAddress: IVendorWorkshopAddressRequestDto;
}
