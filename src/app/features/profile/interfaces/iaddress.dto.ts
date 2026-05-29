export interface IAddressDto {
  id?: string;
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  primary?: boolean;
}
