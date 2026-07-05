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
import Chart from 'chart.js/auto';

import { VendorProductService } from '../../services/vendor-product.service';
import { VendorReviewsService } from '../../services/vendor-reviews.service';
import { VendorOrdersService } from '../../services/vendor-orders.service';
import { ReportReviewDialog } from '../../components/report-review-dialog/report-review-dialog.component';
import { IProduct } from '../../../products/interfaces/iproduct';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { UiState } from '../../../../core/state/ui.state';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { LocalizedPipe } from '../../../../shared/pipes/localized.pipe';
import { localized } from '../../../../shared/utils/localized';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { IVendorOrdersPaginatedResponse } from '../../interfaces/ivendor-order';


@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReportReviewDialog,
    CurrencyFormatPipe,
    LocalizedPipe,
    SkeletonLoader,
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
  private destroyRef = inject(DestroyRef);

  // Read-only references to shared reactive signals
  readonly products = this.vendorProductService.products;
  readonly reviews = this.vendorReviewsService.reviews;
  readonly metrics = signal<any | null>(null);

  readonly loading = signal<boolean>(true);

  // New signals for stats and top product from backend (Requirement 5)
  readonly productStats = signal<{ total: number; active: number; archived: number } | null>(null);
  readonly topProduct = signal<IProduct | null>(null);

  // Analytics Trend and Product Status Signals
  readonly revenueAnalyticsData = signal<any[]>([]);
  readonly ordersAnalyticsData = signal<any[]>([]);
  readonly selectedTrend = signal<'revenue' | 'orders'>('revenue');

  // Chart instances trackers
  private trendChartInstance: any = null;
  private statusChartInstance: any = null;

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

  // Computed Reviews Analytics
  readonly totalReviewsCount = computed(() => this.reviews().length);

  readonly averageRating = computed(() => {
    const list = this.reviews();
    if (list.length === 0) {
      return (this.topRatedProduct()?.averageRating ?? 5.0).toFixed(1);
    }
    const sum = list.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / list.length).toFixed(1);
  });

  readonly positiveReviewsPercentage = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 100;
    const pos = list.filter(r => r.rating >= 4).length;
    return Math.round((pos / list.length) * 100);
  });

  ratingDistributionCount(star: number): number {
    return this.reviews().filter(r => r.rating === star).length;
  }

  ratingDistributionPercentage(star: number): number {
    const total = this.reviews().length;
    if (total === 0) {
      if (star === 5) return 80;
      if (star === 4) return 20;
      return 0;
    }
    return (this.ratingDistributionCount(star) / total) * 100;
  }

  readonly activeProductsPercentage = computed(() => {
    const total = this.totalProducts();
    if (total === 0) return 0;
    return Math.round((this.activeProducts() / total) * 100);
  });

  readonly archivedProductsPercentage = computed(() => {
    const total = this.totalProducts();
    if (total === 0) return 0;
    return Math.round((this.archivedProducts() / total) * 100);
  });

  readonly isTrendDataEmpty = computed(() => {
    return this.revenueAnalyticsData().length === 0 && this.ordersAnalyticsData().length === 0;
  });

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

      this.destroyRef.onDestroy(() => {
        this.destroyCharts();
      });
    }
  }

  destroyCharts(): void {
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
      this.trendChartInstance = null;
    }
    if (this.statusChartInstance) {
      this.statusChartInstance.destroy();
      this.statusChartInstance = null;
    }
  }

  selectTrendTab(trend: 'revenue' | 'orders'): void {
    if (this.selectedTrend() === trend) return;
    this.selectedTrend.set(trend);
    this.renderTrendChart();
  }

  private getFallbackData() {
    const labels = [];
    const revenueValues = [];
    const ordersValues = [];
    const now = new Date();
    const isAr = this.translationService.currentLang() === 'ar';
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
      labels.push(label);
      revenueValues.push(0);
      ordersValues.push(0);
    }
    return { labels, revenueValues, ordersValues };
  }

  private formatDateLabel(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(this.translationService.currentLang() === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  renderTrendChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const ctx = document.getElementById('trendChartCanvas') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
      this.trendChartInstance = null;
    }

    const isAr = this.translationService.currentLang() === 'ar';
    const isRevenue = this.selectedTrend() === 'revenue';

    const revData = this.revenueAnalyticsData();
    const ordData = this.ordersAnalyticsData();

    let labels: string[] = [];
    let dataValues: number[] = [];

    const fallback = this.getFallbackData();

    if (isRevenue) {
      if (revData && revData.length > 0) {
        labels = revData.map(p => p.dateLabel || p.date || this.formatDateLabel(p.placedAt || p.placedDate || ''));
        dataValues = revData.map(p => Number(p.revenue || p.total || p.amount || 0));
      } else {
        labels = fallback.labels;
        dataValues = fallback.revenueValues;
      }
    } else {
      if (ordData && ordData.length > 0) {
        labels = ordData.map(p => p.dateLabel || p.date || this.formatDateLabel(p.placedAt || p.placedDate || ''));
        dataValues = ordData.map(p => Number(p.orders || p.count || p.totalOrders || p.value || 0));
      } else {
        labels = fallback.labels;
        dataValues = fallback.ordersValues;
      }
    }

    const goldColor = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
    const gradient = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 280);
    if (gradient) {
      gradient.addColorStop(0, 'rgba(184, 147, 92, 0.38)');
      gradient.addColorStop(0.5, 'rgba(184, 147, 92, 0.15)');
      gradient.addColorStop(1, 'rgba(184, 147, 92, 0.00)');
    }

    this.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: isRevenue
            ? (isAr ? 'الإيرادات اليومية' : 'Daily Revenue')
            : (isAr ? 'عدد الطلبات اليومية' : 'Daily Orders'),
          data: dataValues,
          borderColor: goldColor,
          borderWidth: 2.5,
          backgroundColor: gradient || 'rgba(184, 147, 92, 0.06)',
          fill: true,
          tension: 0.25,
          pointBackgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
          pointBorderColor: goldColor,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-card').trim() : 'var(--color-heading)',
            titleColor: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() : '#fff',
            bodyColor: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() : 'var(--color-border)',
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
            borderWidth: 1,
            padding: 12,
            boxPadding: 4,
            usePointStyle: true,
            cornerRadius: 8,
            titleFont: {
              family: 'Outfit, sans-serif',
              size: 11,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Outfit, sans-serif',
              size: 11
            },
            callbacks: {
              label: (context: any) => {
                let value = context.parsed.y;
                if (isRevenue) {
                  return ` ${isAr ? 'إيرادات' : 'Revenue'}: EGP ${value.toLocaleString()}`;
                } else {
                  return ` ${isAr ? 'الطلبات' : 'Orders'}: ${value}`;
                }
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category' as const,
            offset: false,
            grid: {
              display: false,
            },
            ticks: {
              color: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() : '#70675a',
              font: {
                size: 9,
                family: 'Outfit, sans-serif'
              }
            }
          },
          y: {
            grid: {
              color: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim() : 'rgba(31, 28, 24, 0.04)',
            },
            ticks: {
              color: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() : '#70675a',
              font: {
                size: 9,
                family: 'Outfit, sans-serif'
              },
              callback: (value: any) => {
                if (isRevenue) {
                  return 'EGP ' + value.toLocaleString();
                }
                return value;
              }
            }
          }
        }
      }
    });
  }

  renderStatusChart(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const ctx = document.getElementById('statusChartCanvas') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.statusChartInstance) {
      this.statusChartInstance.destroy();
      this.statusChartInstance = null;
    }

    const isAr = this.translationService.currentLang() === 'ar';
    const active = this.activeProducts();
    const archived = this.archivedProducts();

    const activeVal = active || 0;
    const archivedVal = archived || 0;

    this.statusChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: [
          isAr ? 'المنتجات النشطة' : 'Active Products',
          isAr ? 'المنتجات المؤرشفة' : 'Archived Products'
        ],
        datasets: [{
          data: [activeVal, archivedVal],
          backgroundColor: [getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(), 'var(--color-border)'],
          borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
          borderWidth: 2.5,
          hoverBorderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
          hoverBorderWidth: 1,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-card').trim() : 'var(--color-heading)',
            titleColor: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() : '#fff',
            bodyColor: typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue('--color-text-muted').trim() : 'var(--color-border)',
            borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim(),
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
            titleFont: {
              family: 'Outfit, sans-serif',
              size: 11,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Outfit, sans-serif',
              size: 11
            },
            callbacks: {
              label: (context: any) => {
                const value = context.parsed;
                const total = activeVal + archivedVal;
                const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                return ` ${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  initCharts(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.renderTrendChart();
    this.renderStatusChart();
  }

  private getAggregatedAnalytics(orders: any[]) {
    const labels: string[] = [];
    const revenueValues: number[] = [];
    const ordersValues: number[] = [];

    // Always anchor to the current system date (today) to ensure the timeline is live
    const now = new Date();

    const isAr = this.translationService.currentLang() === 'ar';

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime());
      d.setDate(now.getDate() - i);

      const label = d.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
      labels.push(label);

      // Compute range boundaries for this day
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

      // Filter orders placed on this calendar day
      const dayOrders = orders.filter(o => {
        if (!o.placedAt) return false;
        try {
          const placedDate = new Date(o.placedAt);
          return placedDate >= dayStart && placedDate <= dayEnd;
        } catch {
          return false;
        }
      });

      // Calculate revenue from delivered or completed orders only to match the Total Revenue KPI exactly
      const dayRevenue = dayOrders
        .filter(o => o.status === 'delivered' || o.status === 'completed')
        .reduce((sum, o) => sum + Number(o.totalAmount || o.subtotal || 0), 0);

      // Count all orders placed on this day to match Total Orders KPI exactly
      const dayOrdersCount = dayOrders.length;

      revenueValues.push(dayRevenue);
      ordersValues.push(dayOrdersCount);
    }

    return { labels, revenueValues, ordersValues };
  }

  loadDashboardData(): void {
    this.loading.set(true);

    const products$ = this.vendorProductService.getVendorProducts().pipe(catchError(err => { console.error(err); return of([]); }));
    const reviews$ = this.vendorReviewsService.getVendorReviews().pipe(catchError(err => { console.error(err); return of([]); }));

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

    // Fetch live orders list to compute precise consistent metrics and daily trends
    const orders$ = this.vendorOrdersService.getFilteredOrders({ pageSize: 100 }).pipe(
      catchError(err => {
        console.error('Failed to load filtered orders:', err);
        return of({ data: [], totalCount: 0, pageNumber: 1, pageSize: 100, totalPages: 1 } as IVendorOrdersPaginatedResponse);
      })
    );

    forkJoin([
      products$,
      reviews$,
      stats$,
      topProduct$,
      orders$
    ]).subscribe({
      next: (response: [IProduct[], any[], any, IProduct | null, IVendorOrdersPaginatedResponse]) => {
        console.log('Vendor Dashboard Data Loaded successfully from real sources:', response);
        const [prods, revs, stats, topProd, ordersResult] = response;
        const orders = ordersResult.data;

        this.topProduct.set(topProd);

        // Dynamically compute absolute consistent metrics directly from live orders
        const totalOrders = orders.length;

        const completedOrdersCount = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
        const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
        const activeOrdersCount = orders.filter(o => o.status === 'confirmed' || o.status === 'processing' || o.status === 'ready').length;

        // Sum total amount for completed/delivered orders
        const totalRevenue = orders
          .filter(o => o.status === 'delivered' || o.status === 'completed')
          .reduce((sum, o) => sum + Number(o.totalAmount || o.subtotal || 0), 0);

        const computedMetrics = {
          totalOrders,
          totalRevenue,
          pendingOrdersCount,
          completedOrdersCount,
          activeOrdersCount
        };

        console.log('[Dashboard Audit] Calculated metrics from orders:', computedMetrics);
        this.metrics.set(computedMetrics);

        // Dynamically aggregate trend charts using live orders dates to avoid flat zero curves
        const aggregated = this.getAggregatedAnalytics(orders);
        console.log('[Dashboard Audit] Aggregated daily trends:', aggregated);

        this.revenueAnalyticsData.set(aggregated.revenueValues.map((val, idx) => ({
          dateLabel: aggregated.labels[idx],
          revenue: val
        })));

        this.ordersAnalyticsData.set(aggregated.ordersValues.map((val, idx) => ({
          dateLabel: aggregated.labels[idx],
          orders: val
        })));

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

        setTimeout(() => {
          this.initCharts();
        }, 50);
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
