export type PaymobCallbackStatus = 'success' | 'failed' | 'cancelled';

export interface IPaymobCallbackResponse {
  success: boolean;
  message: string;
  transactionId: string;
  orderId: number;
  status: PaymobCallbackStatus;
  pending?: boolean;
  error?: string | null;
  data?: Record<string, unknown>;
}
