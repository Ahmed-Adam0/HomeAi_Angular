export interface IVendorRevenuePeriod {
  label: string;
  startDate: string;
  endDate: string;
}

export interface IVendorRevenueBreakdownItem {
  label: string;
  amount: number;
  percentage: number;
}

export interface IVendorRevenuePayout {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledAt: string;
  completedAt?: string;
}

export interface IVendorRevenue {
  period: IVendorRevenuePeriod;
  currency: string;
  grossRevenue: number;
  netRevenue: number;
  platformFees: number;
  refunds: number;
  pendingPayout: number;
  completedPayout: number;
  breakdown: IVendorRevenueBreakdownItem[];
  recentPayouts: IVendorRevenuePayout[];
}

export interface IVendorRevenueSummary {
  currency: string;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  pendingPayout: number;
  changePercentWeek: number;
  changePercentMonth: number;
}
