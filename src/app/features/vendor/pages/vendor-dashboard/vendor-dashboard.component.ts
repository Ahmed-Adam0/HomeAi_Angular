import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
  PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { VendorProductService } from '../../services/vendor-product.service';
import { VendorReviewsService } from '../../services/vendor-reviews.service';
import { VendorOrdersService } from '../../services/vendor-orders.service';
import { ReportReviewDialog } from '../../components/report-review-dialog/report-review-dialog.component';
import { IProduct } from '../../../products/interfaces/iproduct';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReportReviewDialog,
    CurrencyFormatPipe,
  ],
  templateUrl: './vendor-dashboard.component.html',
  styleUrl: './vendor-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class VendorDashboard implements OnInit {
  private vendorProductService = inject(VendorProductService);
  private vendorReviewsService = inject(VendorReviewsService);
  private vendorOrdersService = inject(VendorOrdersService);
  readonly translationService = inject(TranslationService);
  private uiState = inject(UiState);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);

  // Read-only references to shared reactive signals
  readonly products = this.vendorProductService.products;
  readonly reviews = this.vendorReviewsService.reviews;
  readonly metrics = this.vendorOrdersService.dashboardMetrics;

  readonly loading = signal<boolean>(true);

  // New signals for stats and top product from backend (Requirement 5)
  readonly productStats = signal<{ total: number; active: number; archived: number } | null>(null);
  readonly topProduct = signal<IProduct | null>(null);

  // Computed statistics from products & stats endpoint fallback
  readonly totalProducts = computed(() => this.productStats()?.total ?? this.products().length);
  readonly activeProducts = computed(() => this.productStats()?.active ?? this.products().filter(p => p.isActive).length);
  readonly archivedProducts = computed(() => this.productStats()?.archived ?? this.products().filter(p => !p.isActive).length);

  readonly topRatedProduct = computed(() => {
    if (this.topProduct()) {
      return this.topProduct();
    }
    const list = this.products().filter(p => p.averageRating !== undefined && p.averageRating > 0);
    if (list.length === 0) return null;
    return [...list].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))[0];
  });

  readonly recentReviews = computed(() => this.reviews().slice(0, 3));
  readonly reportedReviewsCount = computed(() => this.reviews().filter(r => r.isReported).length);



  // Inline review reply tracking
  readonly activeReplyReviewId = signal<string | number | null>(null);
  readonly replyText = signal<string>('');
  readonly submittingReply = signal<boolean>(false);

  // Report modal states
  readonly reportModalVisible = signal<boolean>(false);
  readonly selectedReportReviewId = signal<string | number | null>(null);
  readonly submittingReport = signal<boolean>(false);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadDashboardData();
    }
  }

  loadDashboardData(): void {
    this.loading.set(true);

    const products$ = this.vendorProductService.getVendorProducts().pipe(catchError(err => { console.error(err); return of([]); }));
    const reviews$ = this.vendorReviewsService.getVendorReviews().pipe(catchError(err => { console.error(err); return of([]); }));
    const metrics$ = this.vendorOrdersService.getDashboardMetrics().pipe(catchError(err => { console.error(err); return of(null); }));

    // Stats & Top rated product queries (Requirement 5)
    const stats$ = this.vendorProductService.getVendorStats().pipe(
      catchError(err => {
        console.warn('Failed to load vendor stats (warning only):', err);
        return of(null);
      })
    );
    const topProduct$ = this.vendorProductService.getTopVendorProducts().pipe(
      map((prods: IProduct[]) => prods && prods.length > 0 ? prods[0] : null),
      catchError(err => {
        console.warn('Failed to load top vendor product (warning only):', err);
        return of(null);
      })
    );

    forkJoin([
      products$,
      reviews$,
      metrics$,
      stats$,
      topProduct$
    ]).subscribe({
      next: (response: [IProduct[], any[], any, any, IProduct | null]) => {
        console.log('Vendor Dashboard Data Loaded successfully:', response);
        const [prods, revs, metrics, stats, topProd] = response;

        this.topProduct.set(topProd);

        if (stats) {
          this.productStats.set({
            total: Number(stats.totalProducts ?? stats.totalCount ?? stats.total ?? prods.length),
            active: Number(stats.activeProducts ?? stats.activeProductsCount ?? stats.activeCount ?? stats.active ?? prods.filter(p => p.isActive).length),
            archived: Number(stats.archivedProducts ?? stats.archivedProductsCount ?? stats.archivedCount ?? stats.archived ?? stats.inactiveProducts ?? stats.inactiveProductsCount ?? stats.inactiveCount ?? stats.inactive ?? prods.filter(p => !p.isActive).length)
          });
        } else {
          this.productStats.set({
            total: prods.length,
            active: prods.filter(p => p.isActive).length,
            archived: prods.filter(p => !p.isActive).length
          });
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load dashboard statistics', err);
        this.loading.set(false);
      }
    });
  }

  // Quick Inline reply handler
  toggleReplyForm(reviewId: string | number): void {
    if (this.activeReplyReviewId() === reviewId) {
      this.activeReplyReviewId.set(null);
      this.replyText.set('');
    } else {
      const review = this.reviews().find(r => r.id === reviewId);
      this.activeReplyReviewId.set(reviewId);
      this.replyText.set(review?.replyText || '');
    }
  }

  submitReply(reviewId: string | number): void {
    const text = this.replyText().trim();
    if (!text) return;

    const isAr = this.translationService.currentLang() === 'ar';
    this.submittingReply.set(true);
    this.uiState.showLoader();

    this.vendorReviewsService.replyToReview(reviewId, text).subscribe({
      next: () => {
        this.submittingReply.set(false);
        this.activeReplyReviewId.set(null);
        this.replyText.set('');
        this.uiState.hideLoader();
        this.uiState.showAlert('success', isAr ? 'تم إرسال الرد بنجاح.' : 'Reply submitted successfully.');
      },
      error: (err) => {
        console.error('Failed to submit reply', err);
        this.submittingReply.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert('danger', isAr ? 'فشل إرسال الرد.' : 'Failed to submit reply.');
      }
    });
  }

  // Quick report handler
  openReportModal(reviewId: string | number): void {
    const review = this.reviews().find(r => r.id === reviewId);
    if (review?.isReported) {
      const isAr = this.translationService.currentLang() === 'ar';
      this.uiState.showAlert('warning', isAr ? 'تم الإبلاغ عن هذا التقييم بالفعل.' : 'This review has already been reported.');
      return;
    }
    this.selectedReportReviewId.set(reviewId);
    this.reportModalVisible.set(true);
  }

  closeReportModal(): void {
    this.reportModalVisible.set(false);
    this.selectedReportReviewId.set(null);
  }

  onSubmitReport(event: { reason: string; notes: string }): void {
    const reviewId = this.selectedReportReviewId();
    if (!reviewId) return;

    const isAr = this.translationService.currentLang() === 'ar';
    this.submittingReport.set(true);
    this.uiState.showLoader();

    this.vendorReviewsService.reportReview(reviewId, event).subscribe({
      next: () => {
        this.submittingReport.set(false);
        this.closeReportModal();
        this.uiState.hideLoader();
        this.uiState.showAlert('success', isAr ? 'تم تقديم البلاغ للمراجعة.' : 'Report submitted for review.');
      },
      error: (err) => {
        console.error('Failed to submit report', err);
        this.submittingReport.set(false);
        this.uiState.hideLoader();
        this.uiState.showAlert('danger', isAr ? 'فشل تقديم البلاغ.' : 'Failed to submit report.');
      }
    });
  }




}
