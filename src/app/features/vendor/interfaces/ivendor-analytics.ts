import { VendorMetricType } from '../models/vendor-metric-type.enum';

export interface IVendorMetric {
  type: VendorMetricType;
  label: string;
  value: number;
  previousValue?: number;
  changePercent?: number;
  unit?: string;
  currency?: string;
}

export interface IVendorAnalyticsTrendPoint {
  date: string;
  value: number;
}

export interface IVendorAnalyticsTrend {
  metricType: VendorMetricType;
  label: string;
  points: IVendorAnalyticsTrendPoint[];
}

export interface IVendorAnalytics {
  periodStart: string;
  periodEnd: string;
  metrics: IVendorMetric[];
  trends: IVendorAnalyticsTrend[];
  topProducts: IVendorTopProductMetric[];
}

export interface IVendorTopProductMetric {
  productId: string;
  productName: string;
  unitsSold: number;
  revenue: number;
  currency: string;
}

export interface IVendorAnalyticsSummary {
  metrics: IVendorMetric[];
  periodLabel: string;
}
