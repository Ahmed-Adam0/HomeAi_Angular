export interface IVendorWorkshopAddress {
  city: string | null;
  area: string | null;
  street: string | null;
  buildingNumber: string | null;
  notes: string | null;
}

export interface IVendorProfile {
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  preferredLanguage: string;
  workshopNameAr: string | null;
  workshopNameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  workshopAddress: IVendorWorkshopAddress;
  logoUrl?: string | null;
}

export interface IVendorProfileUpdateRequest {
  fullName: string | null;
  phoneNumber: string | null;
  email: string | null;
  preferredLanguage: string;
  workshopNameAr: string | null;
  workshopNameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  workshopAddress: IVendorWorkshopAddress;
}
