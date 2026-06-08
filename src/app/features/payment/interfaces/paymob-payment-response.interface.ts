export type PaymobPaymentStatus = 'pending' | 'success' | 'failed';

export interface IPaymobPaymentResponse {
  success: boolean;
  message: string;
  transactionId: string;
  paymentUrl: string;
  orderId: number;
  status: PaymobPaymentStatus;
}
