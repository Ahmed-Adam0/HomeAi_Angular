import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { IVendorAnalytics, IVendorMetric } from '../../interfaces';
import { VendorMetricType } from '../../models/vendor-metric-type.enum';

type AnalyticsCardIcon = 'sales' | 'check-circle' | 'active-orders' | 'top-products';
type AnalyticsCardVariant = 'success' | 'primary' | 'warning' | 'info';

interface AnalyticsCardVm {
  titleKey: string;
  value: string | number;
  icon: AnalyticsCardIcon;
  trend?: number;
  variant: AnalyticsCardVariant;
}

@Component({
  selector: 'app-analytics-cards',
  standalone: true,
  imports: [DecimalPipe, TranslatePipe],
  templateUrl: './analytics-cards.component.html',
  styleUrl: './analytics-cards.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsCards {
  private readonly currencyFormat = inject(CurrencyFormatPipe);
  private readonly translationService = inject(TranslationService);

  readonly analytics = input.required<IVendorAnalytics>();

  readonly cards = computed((): AnalyticsCardVm[] => {
    this.translationService.currentLang();
    const data = this.analytics();
    const salesMetric = this.findMetric(data, VendorMetricType.Sales);
    const ordersMetric = this.findMetric(data, VendorMetricType.Orders);
    const topProduct = data?.topProducts?.[0];

    return [
      {
        titleKey: 'VENDOR.ANALYTICS.TOTAL_SALES',
        value: this.formatMetricValue(salesMetric),
        icon: 'sales',
        trend: salesMetric?.changePercent,
        variant: 'success',
      },
      {
        titleKey: 'VENDOR.ANALYTICS.ORDERS_COMPLETED',
        value: this.formatMetricValue(ordersMetric),
        icon: 'check-circle',
        trend: ordersMetric?.changePercent,
        variant: 'primary',
      },
      {
        titleKey: 'VENDOR.ANALYTICS.ACTIVE_ORDERS',
        value: '0',
        icon: 'active-orders',
        variant: 'warning',
      },
      {
        titleKey: 'VENDOR.ANALYTICS.TOP_PRODUCTS',
        value: topProduct?.productName ?? this.translationService.translate('VENDOR.COMMON.NO_DATA'),
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
