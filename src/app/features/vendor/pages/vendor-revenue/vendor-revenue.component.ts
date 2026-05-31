import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RevenueCards } from '../../components';
import { IVendorRevenue } from '../../interfaces';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-vendor-revenue',
  standalone: true,
  imports: [RevenueCards, TranslatePipe],
  templateUrl: './vendor-revenue.component.html',
  styleUrl: './vendor-revenue.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRevenue {
  readonly revenue = signal<IVendorRevenue | null>(null);

  readonly isRevenueLoading = computed(() => this.revenue() === null);

  readonly kpiSkeletonSlots = [0, 1, 2, 3] as const;

  readonly insightsPlaceholderSlots = [0, 1, 2] as const;
}
