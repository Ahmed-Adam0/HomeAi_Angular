export interface IDailyBreakdown {
  date: string;
  revenue: number;
  ordersCount?: number;
}

export interface IMonthlyBreakdown {
  month: string;
  revenue: number;
  ordersCount?: number;
}

export interface IOrdersByStatus {
  status: string;
  count: number;
  percentage?: number;
}

export interface IRevenueAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  completedOrdersCount: number;
  dailyBreakdown: IDailyBreakdown[];
  ordersByStatus: IOrdersByStatus[];
  monthlyBreakdown: IMonthlyBreakdown[];
}

export interface IRevenueAnalyticsState {
  data: IRevenueAnalytics | null;
  loading: boolean;
  error: string | null;
}
