export interface IDailyRevenueDto {
  date: string;
  revenue: number;
  ordersCount: number;
}

export interface IVendorRevenueStatisticsDto {
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  dailyRevenue: number;
  completedOrdersCount: number;
  dailyBreakdown: IDailyRevenueDto[];
}
