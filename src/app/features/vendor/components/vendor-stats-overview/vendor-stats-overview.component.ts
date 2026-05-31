import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { IVendorAnalytics, IVendorMetric } from '../../interfaces';
import { VendorMetricType } from '../../models/vendor-metric-type.enum';

type VendorStatIcon = 'orders' | 'revenue' | 'active-orders' | 'notifications';

type VendorStatTrendTone = 'up' | 'down' | 'neutral';

interface VendorStatCardVm {
  readonly id: string;
  readonly labelKey: string;
  readonly value: string;
  readonly trendPercent?: number;
  readonly trendTone?: VendorStatTrendTone;
  readonly icon: VendorStatIcon;
}

@Component({
  selector: 'app-vendor-stats-overview',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
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
        labelKey: 'VENDOR.STATS.TOTAL_ORDERS',
        value: this.formatCount(ordersMetric),
        ...this.buildTrend(ordersMetric?.changePercent),
        icon: 'orders',
      },
      {
        id: 'revenue',
        labelKey: 'VENDOR.STATS.REVENUE',
        value: this.formatRevenue(revenueMetric),
        ...this.buildTrend(revenueMetric?.changePercent),
        icon: 'revenue',
      },
      {
        id: 'active-orders',
        labelKey: 'VENDOR.STATS.ACTIVE_ORDERS',
        value: '0',
        icon: 'active-orders',
      },
      {
        id: 'notifications',
        labelKey: 'VENDOR.STATS.NOTIFICATIONS',
        value: '0',
        icon: 'notifications',
      },
    ];
  });

  protected getTrendDirection(trend: number): VendorStatTrendTone {
    if (trend > 0) {
      return 'up';
    }

    if (trend < 0) {
      return 'down';
    }

    return 'neutral';
  }

  protected getTrendMagnitude(trend: number): number {
    return Math.abs(trend);
  }

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
    trendPercent?: number;
    trendTone?: VendorStatTrendTone;
  } {
    if (changePercent === undefined || changePercent === null) {
      return {};
    }

    if (changePercent > 0) {
      return {
        trendPercent: changePercent,
        trendTone: 'up',
      };
    }

    if (changePercent < 0) {
      return {
        trendPercent: changePercent,
        trendTone: 'down',
      };
    }

    return {
      trendPercent: 0,
      trendTone: 'neutral',
    };
  }
}
