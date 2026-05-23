export interface IBillingDetails {
  fullName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  zipCode: string;
  country: string;
}

export interface ICheckoutDetails {
  billingDetails: IBillingDetails;
  shippingOption: 'standard' | 'express';
  paymentProvider: 'stripe' | 'paypal' | 'paymob';
}
