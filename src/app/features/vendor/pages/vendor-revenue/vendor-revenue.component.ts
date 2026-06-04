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
import { RevenueCards } from '../../components';
import { IVendorRevenue } from '../../interfaces';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { VendorService } from '../../services/vendor.service';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-vendor-revenue',
  standalone: true,
  imports: [RevenueCards, TranslatePipe, SkeletonLoader],
  templateUrl: './vendor-revenue.component.html',
  styleUrl: './vendor-revenue.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorRevenue implements OnInit {
  private readonly vendorService = inject(VendorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly revenue = signal<IVendorRevenue | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly isRevenueLoading = computed(() => this.loading() && this.revenue() === null);

  readonly kpiSkeletonSlots = [0, 1, 2, 3] as const;
  readonly insightsPlaceholderSlots = [0, 1, 2] as const;

  ngOnInit(): void {
    this.loadRevenue();
  }

  private loadRevenue(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vendorService
      .getRevenue()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.revenue.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Failed to load vendor revenue:', err);
          this.error.set(err.message || 'An error occurred while loading revenue.');
          this.loading.set(false);
        },
      });
  }
}
