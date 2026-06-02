import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AnalyticsCards } from '../../components';
import { IVendorAnalytics } from '../../interfaces';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { VendorService } from '../../services/vendor.service';

@Component({
  selector: 'app-vendor-analytics',
  standalone: true,
  imports: [AnalyticsCards, TranslatePipe],
  templateUrl: './vendor-analytics.component.html',
  styleUrl: './vendor-analytics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorAnalytics implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly analytics = signal<IVendorAnalytics | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly isAnalyticsLoading = computed(() => this.loading() && this.analytics() === null);

  readonly kpiSkeletonSlots = [0, 1, 2, 3] as const;

  readonly insightsPlaceholderSlots = [0, 1, 2] as const;

  readonly productsPlaceholderSlots = [0, 1, 2, 3, 4] as const;

  ngOnInit(): void {
    this.loadAnalytics();
  }

  private loadAnalytics(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vendorService
      .getAnalytics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.analytics.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load vendor analytics:', err);
          this.error.set(err.message || 'An error occurred while loading analytics.');
          this.loading.set(false);
        },
      });
  }
}
