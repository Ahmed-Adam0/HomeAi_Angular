import { DecimalPipe } from '@angular/common';
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

type AnalyticsCardIcon = 'sales' | 'check-circle' | 'active-orders' | 'top-products';
type AnalyticsCardVariant = 'success' | 'primary' | 'warning' | 'info';

interface AnalyticsCardVm {
  title: string;
  value: string | number;
  icon: AnalyticsCardIcon;
  trend?: number;
  variant: AnalyticsCardVariant;
}

@Component({
  selector: 'app-analytics-cards',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './analytics-cards.component.html',
  styleUrl: './analytics-cards.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsCards {
  private readonly currencyFormat = inject(CurrencyFormatPipe);

  readonly analytics = input.required<IVendorAnalytics>();

  readonly cards = computed((): AnalyticsCardVm[] => {
    const data = this.analytics();
    const salesMetric = this.findMetric(data, VendorMetricType.Sales);
    const ordersMetric = this.findMetric(data, VendorMetricType.Orders);
    const topProduct = data?.topProducts?.[0];

    return [
      {
        title: 'Total Sales',
        value: this.formatMetricValue(salesMetric),
        icon: 'sales',
        trend: salesMetric?.changePercent,
        variant: 'success',
      },
      {
        title: 'Orders Completed',
        value: this.formatMetricValue(ordersMetric),
        icon: 'check-circle',
        trend: ordersMetric?.changePercent,
        variant: 'primary',
      },
      {
        title: 'Active Orders',
        value: '0',
        icon: 'active-orders',
        variant: 'warning',
      },
      {
        title: 'Top Performing Products',
        value: topProduct?.productName ?? '—',
        icon: 'top-products',
        variant: 'info',
      },
    ];
  });

  protected getTrendDirection(trend: number): 'up' | 'down' | 'neutral' {
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

  private formatMetricValue(metric: IVendorMetric | undefined): string {
    if (!metric) {
      return '0';
    }

    if (metric.currency) {
      return this.currencyFormat.transform(metric.value ?? 0);
    }

    return String(metric.value ?? 0);
  }
}
