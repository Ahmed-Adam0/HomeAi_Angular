export interface IVendorWallet {
  availableBalance: number;
  totalWithdrawn: number;
}

export interface IWithdrawalRequest {
  amount: number;
  walletNumber: string;
}

export interface IVendorWithdrawal {
  id: number;
  amount: number;
  walletNumber: string;
  status: 'Pending' | 'Completed' | 'Failed';
  transactionReference: string | null;
  createdAt: string;
}

export interface IWithdrawalResponse {
  success: boolean;
  message: string;
  withdrawal: IVendorWithdrawal | null;
}
