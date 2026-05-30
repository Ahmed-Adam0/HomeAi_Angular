import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { AnalyticsCards } from '../../components';
import { IVendorAnalytics } from '../../interfaces';

@Component({
  selector: 'app-vendor-analytics',
  standalone: true,
  imports: [AnalyticsCards],
  templateUrl: './vendor-analytics.component.html',
  styleUrl: './vendor-analytics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorAnalytics {
  readonly analytics = signal<IVendorAnalytics | null>(null);

  readonly isAnalyticsLoading = computed(() => this.analytics() === null);

  readonly kpiSkeletonSlots = [0, 1, 2, 3] as const;

  readonly insightsPlaceholderSlots = [0, 1, 2] as const;

  readonly productsPlaceholderSlots = [0, 1, 2, 3, 4] as const;
}
