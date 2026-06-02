export interface IVendorLoginRequest {
  email: string;
  password: string;
}

export interface IVendorRegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
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
