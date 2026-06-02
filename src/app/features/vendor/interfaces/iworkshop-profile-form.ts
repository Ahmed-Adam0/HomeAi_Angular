export interface IVendorProfileFormValue {
  fullName: string;
  phoneNumber: string;
  email: string;
  preferredLanguage: string;
  workshopNameAr: string;
  workshopNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  workshopAddress: {
    city: string;
    area: string;
    street: string;
    buildingNumber: string;
    notes: string;
  };
}
