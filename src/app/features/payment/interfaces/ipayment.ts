export type PaymentProvider = 'stripe' | 'paypal' | 'paymob';

export interface IPaymentMethod {
  id: string;
  name: string;
  provider: PaymentProvider;
  icon?: string;
  enabled: boolean;
}

export interface IPaymentIntent {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  provider: PaymentProvider;
  clientSecret?: string;
}
