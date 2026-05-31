import { IVendorRevenueStatisticsDto } from '../dto/vendor-revenue-statistics.dto';
import { IVendorRevenue } from '../../interfaces/ivendor-revenue';

/**
 * Maps IVendorRevenueStatisticsDto to IVendorRevenue ViewModel.
 */
export function mapVendorRevenueStatistics(
  dto: IVendorRevenueStatisticsDto
): IVendorRevenue {
  return {
    period: {
      label: '',
      startDate: '',
      endDate: '',
    },
    currency: 'USD',
    grossRevenue: dto.totalRevenue,
    netRevenue: dto.monthlyRevenue,
    platformFees: 0,
    refunds: 0,
    pendingPayout: 0,
    completedPayout: 0,
    breakdown: (dto.dailyBreakdown || []).map((item) => ({
      label: item.date,
      amount: item.revenue,
      percentage: dto.totalRevenue > 0 ? (item.revenue / dto.totalRevenue) * 100 : 0,
    })),
    recentPayouts: [],
  };
}
