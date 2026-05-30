import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { IVendorRevenue } from '../../interfaces';

type RevenueCardIcon = 'revenue' | 'calendar' | 'orders' | 'analytics';
type RevenueCardVariant = 'success' | 'primary' | 'warning' | 'info';

interface RevenueCardVm {
  title: string;
  value: string;
  icon: RevenueCardIcon;
  trend?: number;
  variant: RevenueCardVariant;
}

@Component({
  selector: 'app-revenue-cards',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './revenue-cards.component.html',
  styleUrl: './revenue-cards.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueCards {
  private readonly currencyFormat = inject(CurrencyFormatPipe);

  readonly revenue = input.required<IVendorRevenue>();

  readonly cards = computed((): RevenueCardVm[] => {
    const data = this.revenue();

    return [
      {
        title: 'Total Revenue',
        value: this.toCurrency(data?.grossRevenue),
        icon: 'revenue',
        variant: 'success',
      },
      {
        title: 'Monthly Revenue',
        value: this.toCurrency(data?.netRevenue),
        icon: 'calendar',
        variant: 'primary',
      },
      {
        title: 'Total Orders',
        value: this.toCount(undefined),
        icon: 'orders',
        variant: 'warning',
      },
      {
        title: 'Average Order Value',
        value: this.toCurrency(undefined),
        icon: 'analytics',
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

  private toCurrency(value: number | null | undefined): string {
    return this.currencyFormat.transform(value ?? 0);
  }

  private toCount(value: number | null | undefined): string {
    return String(value ?? 0);
  }
}
