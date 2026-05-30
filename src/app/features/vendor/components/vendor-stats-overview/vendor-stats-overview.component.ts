import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { IVendorAnalytics, IVendorMetric } from '../../interfaces';
import { VendorMetricType } from '../../models/vendor-metric-type.enum';

type VendorStatIcon = 'orders' | 'revenue' | 'active-orders' | 'notifications';

type VendorStatTrendTone = 'up' | 'down' | 'neutral';

interface VendorStatCardVm {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly trend?: string;
  readonly trendTone?: VendorStatTrendTone;
  readonly icon: VendorStatIcon;
}

@Component({
  selector: 'app-vendor-stats-overview',
  standalone: true,
  templateUrl: './vendor-stats-overview.component.html',
  styleUrl: './vendor-stats-overview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorStatsOverview {
  private readonly currencyFormat = inject(CurrencyFormatPipe);

  readonly analytics = input.required<IVendorAnalytics>();

  readonly cards = computed((): VendorStatCardVm[] => {
    const data = this.analytics();
    const ordersMetric = this.findMetric(data, VendorMetricType.Orders);
    const revenueMetric = this.findMetric(data, VendorMetricType.Revenue);

    return [
      {
        id: 'total-orders',
        label: 'Total Orders',
        value: this.formatCount(ordersMetric),
        ...this.buildTrend(ordersMetric?.changePercent),
        icon: 'orders',
      },
      {
        id: 'revenue',
        label: 'Revenue',
        value: this.formatRevenue(revenueMetric),
        ...this.buildTrend(revenueMetric?.changePercent),
        icon: 'revenue',
      },
      {
        id: 'active-orders',
        label: 'Active Orders',
        value: '0',
        icon: 'active-orders',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        value: '0',
        icon: 'notifications',
      },
    ];
  });

  private findMetric(
    data: IVendorAnalytics | undefined,
    type: VendorMetricType
  ): IVendorMetric | undefined {
    return data?.metrics?.find((metric) => metric.type === type);
  }

  private formatCount(metric: IVendorMetric | undefined): string {
    if (!metric || metric.value == null) {
      return '0';
    }

    return String(metric.value);
  }

  private formatRevenue(metric: IVendorMetric | undefined): string {
    if (!metric || metric.value == null) {
      return this.currencyFormat.transform(0);
    }

    return this.currencyFormat.transform(metric.value);
  }

  private buildTrend(changePercent: number | undefined): {
    trend?: string;
    trendTone?: VendorStatTrendTone;
  } {
    if (changePercent === undefined || changePercent === null) {
      return {};
    }

    if (changePercent > 0) {
      return {
        trend: `↑ ${Math.abs(changePercent).toFixed(1)}%`,
        trendTone: 'up',
      };
    }

    if (changePercent < 0) {
      return {
        trend: `↓ ${Math.abs(changePercent).toFixed(1)}%`,
        trendTone: 'down',
      };
    }

    return {
      trend: '0%',
      trendTone: 'neutral',
    };
  }
}
