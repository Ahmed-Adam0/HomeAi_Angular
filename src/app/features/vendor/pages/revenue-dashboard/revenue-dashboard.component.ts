import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UIChart } from 'primeng/chart';
import { DatePicker } from 'primeng/datepicker';
import { VendorRevenueService } from '../../services/vendor-revenue.service';
import { IRevenueAnalytics } from '../../interfaces';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

interface KpiCard {
  key: string;
  labelKey: string;
  icon: string;
  subtitleKey: string;
  isCurrency: boolean;
}

interface QuickFilter {
  key: string;
  labelKey: string;
  days: number | 'month';
}

function toRfc3339(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function toRfc3339Start(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

@Component({
  selector: 'app-revenue-dashboard',
  standalone: true,
  imports: [UIChart, DatePicker, FormsModule, CurrencyPipe, NgClass, DatePipe, TranslatePipe, CurrencyFormatPipe],
  providers: [CurrencyFormatPipe, DatePipe],
  templateUrl: './revenue-dashboard.component.html',
  styleUrl: './revenue-dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueDashboard implements OnInit {
  protected readonly revenueService = inject(VendorRevenueService);
  private readonly currencyFormat = inject(CurrencyFormatPipe);
  private readonly datePipe = inject(DatePipe);

  readonly data = this.revenueService.revenueSignal;
  readonly loading = this.revenueService.loadingSignal;
  readonly error = this.revenueService.errorSignal;

  readonly skeletonSlots = [0, 1, 2, 3, 4];

  /* ---------- Data State Helpers ---------- */

  /** True when API response is null or totalRevenue is 0 with all empty arrays */
  isEmptyAnalytics(d: IRevenueAnalytics | null): boolean {
    if (!d) return true;
    return d.totalRevenue === 0
      && (!d.dailyBreakdown || d.dailyBreakdown.length === 0)
      && (!d.monthlyBreakdown || d.monthlyBreakdown.length === 0)
      && (!d.ordersByStatus || d.ordersByStatus.length === 0);
  }

  /** True if any KPI value > 0 */
  hasKPIData(d: IRevenueAnalytics | null): boolean {
    if (!d) return false;
    return d.totalRevenue > 0
      || d.monthlyRevenue > 0
      || d.weeklyRevenue > 0
      || d.dailyRevenue > 0
      || d.completedOrdersCount > 0;
  }

  /** True if any chart array has entries */
  hasChartData(d: IRevenueAnalytics | null): boolean {
    if (!d) return false;
    return (d.dailyBreakdown?.length ?? 0) > 0
      || (d.monthlyBreakdown?.length ?? 0) > 0
      || (d.ordersByStatus?.length ?? 0) > 0;
  }

  /** Show empty state: not loading, no error, and either no data or truly empty analytics */
  readonly showEmptyState = computed(() => {
    if (this.loading() || this.error()) return false;
    const d = this.data();
    return !d || this.isEmptyAnalytics(d);
  });

  /** Show content: data exists and is not empty-analytics */
  readonly showContent = computed(() => {
    const d = this.data();
    return !!d && !this.isEmptyAnalytics(d);
  });

  readonly lastUpdated = computed(() => {
    this.data();
    return new Date().toLocaleTimeString();
  });

  /* ---------- Date Range Filter ---------- */

  readonly dateRange = signal<Date[] | null>(null);
  readonly activeFilterKey = signal<string>('all');

  readonly quickFilters: QuickFilter[] = [
    { key: 'today', labelKey: 'VENDOR.REVENUE_DASHBOARD.FILTER_TODAY', days: 0 },
    { key: 'last7', labelKey: 'VENDOR.REVENUE_DASHBOARD.FILTER_7_DAYS', days: 7 },
    { key: 'last30', labelKey: 'VENDOR.REVENUE_DASHBOARD.FILTER_30_DAYS', days: 30 },
    { key: 'thisMonth', labelKey: 'VENDOR.REVENUE_DASHBOARD.FILTER_THIS_MONTH', days: 'month' },
  ];

  readonly hasActiveFilter = computed(() => this.activeFilterKey() !== 'all');

  readonly filterBadgeLabel = computed(() => {
    const key = this.activeFilterKey();
    if (key === 'all') return '';
    const filter = this.quickFilters.find(f => f.key === key);
    return filter ? filter.labelKey : key;
  });

  applyCustomDateFilter(): void {
    const range = this.dateRange();
    if (!range || range.length < 2) return;
    const start = toRfc3339Start(range[0]);
    const end = toRfc3339(range[1]);
    this.revenueService.stopPolling();
    this.revenueService.fetchRevenueAnalytics(start, end)
      .subscribe();
    const fmtStart = this.datePipe.transform(range[0], 'MMM d, y') ?? '';
    const fmtEnd = this.datePipe.transform(range[1], 'MMM d, y') ?? '';
    this.activeFilterKey.set(`${fmtStart} – ${fmtEnd}`);
  }

  applyQuickFilter(filter: QuickFilter): void {
    const end = new Date();
    const start = new Date();
    if (filter.days === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else if (filter.days === 0) {
      start.setHours(0, 0, 0, 0);
    } else {
      start.setDate(start.getDate() - filter.days);
      start.setHours(0, 0, 0, 0);
    }
    this.dateRange.set([start, end]);
    this.revenueService.stopPolling();
    this.revenueService.fetchRevenueAnalytics(
      toRfc3339Start(start),
      toRfc3339(end),
    ).subscribe();
    this.activeFilterKey.set(filter.key);
  }

  clearDateFilter(): void {
    this.dateRange.set(null);
    this.activeFilterKey.set('all');
    this.revenueService.purgeCache();
    this.revenueService.startPolling(30_000);
  }

  /* ---------- KPI cards ---------- */

  readonly kpiCards: KpiCard[] = [
    { key: 'totalRevenue', labelKey: 'VENDOR.REVENUE_DASHBOARD.KPI_TOTAL_REVENUE', icon: 'bi bi-wallet2', subtitleKey: 'VENDOR.REVENUE_DASHBOARD.KPI_TOTAL_REVENUE_SUB', isCurrency: true },
    { key: 'monthlyRevenue', labelKey: 'VENDOR.REVENUE_DASHBOARD.KPI_MONTHLY_REVENUE', icon: 'bi bi-calendar-range', subtitleKey: 'VENDOR.REVENUE_DASHBOARD.KPI_MONTHLY_REVENUE_SUB', isCurrency: true },
    { key: 'weeklyRevenue', labelKey: 'VENDOR.REVENUE_DASHBOARD.KPI_WEEKLY_REVENUE', icon: 'bi bi-graph-up-arrow', subtitleKey: 'VENDOR.REVENUE_DASHBOARD.KPI_WEEKLY_REVENUE_SUB', isCurrency: true },
    { key: 'dailyRevenue', labelKey: 'VENDOR.REVENUE_DASHBOARD.KPI_DAILY_REVENUE', icon: 'bi bi-sun', subtitleKey: 'VENDOR.REVENUE_DASHBOARD.KPI_DAILY_REVENUE_SUB', isCurrency: true },
    { key: 'completedOrdersCount', labelKey: 'VENDOR.REVENUE_DASHBOARD.KPI_COMPLETED_ORDERS', icon: 'bi bi-check2-circle', subtitleKey: 'VENDOR.REVENUE_DASHBOARD.KPI_COMPLETED_ORDERS_SUB', isCurrency: false },
  ];

  private readonly rawValues = computed<Record<string, number>>(() => {
    const d = this.data();
    if (!d) return {} as Record<string, number>;
    return {
      totalRevenue: d.totalRevenue,
      monthlyRevenue: d.monthlyRevenue,
      weeklyRevenue: d.weeklyRevenue,
      dailyRevenue: d.dailyRevenue,
      completedOrdersCount: d.completedOrdersCount,
    };
  });

  readonly displayValues = signal<Record<string, number>>({});
  private prevTargets: Record<string, number> = {};
  private currentAnimated: Record<string, number> = {};
  private rafId: number | null = null;

  private readonly countUpEffect = effect(() => {
    const targets = this.rawValues();
    if (Object.keys(targets).length === 0) return;
    const duration = 700;
    const startTime = performance.now();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    const startVals = { ...this.currentAnimated };
    for (const key of Object.keys(targets)) {
      if (!(key in startVals)) startVals[key] = this.prevTargets[key] ?? 0;
    }
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current: Record<string, number> = {};
      for (const key of Object.keys(targets)) {
        const s = startVals[key];
        const e = targets[key];
        const v = s + (e - s) * eased;
        current[key] = this.kpiCards.find((c) => c.key === key)?.isCurrency
          ? Math.round(v * 100) / 100
          : Math.round(v);
      }
      this.currentAnimated = current;
      this.displayValues.set(current);
      if (progress < 1) {
        this.rafId = requestAnimationFrame(animate);
      } else {
        this.prevTargets = { ...targets };
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(animate);
  });

  getDisplayValue(card: KpiCard): string {
    const val = this.displayValues()[card.key];
    if (val === undefined) return card.isCurrency ? this.currencyFormat.transform(0) : '0';
    return card.isCurrency ? this.currencyFormat.transform(val) : String(val);
  }

  /* ---------- Charts ---------- */

  private readonly palette = ['#b8935c', '#657e5d', '#5c7f93', '#ad5c51', '#b08149', '#8B5CF6', '#EC4899'];

  readonly lineChartData = computed(() => {
    const d = this.data();
    if (!d?.dailyBreakdown?.length) return null;
    return {
      labels: d.dailyBreakdown.map((i) => {
        const date = new Date(i.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [{
        label: 'Revenue',
        data: d.dailyBreakdown.map((i) => i.revenue),
        borderColor: this.palette[0],
        backgroundColor: (ctx: any) => {
          if (!ctx.chart?.ctx) return 'transparent';
          const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          g.addColorStop(0, 'rgba(184, 147, 92, 0.30)');
          g.addColorStop(1, 'rgba(184, 147, 92, 0.0)');
          return g;
        },
        fill: true,
        tension: 0.45,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: this.palette[0],
        pointBorderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointHoverBackgroundColor: this.palette[0],
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        borderWidth: 3,
      }],
    };
  });

  readonly barChartData = computed(() => {
    const d = this.data();
    if (!d?.monthlyBreakdown?.length) return null;
    return {
      labels: d.monthlyBreakdown.map((i) => i.month),
      datasets: [{
        label: 'Revenue',
        data: d.monthlyBreakdown.map((i) => i.revenue),
        backgroundColor: d.monthlyBreakdown.map((_, i) => this.palette[i % this.palette.length] + 'D4'),
        borderColor: d.monthlyBreakdown.map((_, i) => this.palette[i % this.palette.length]),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      }],
    };
  });

  readonly doughnutChartData = computed(() => {
    const d = this.data();
    if (!d?.ordersByStatus?.length) return null;
    return {
      labels: d.ordersByStatus.map((i) => i.status),
      datasets: [{
        data: d.ordersByStatus.map((i) => i.count),
        backgroundColor: d.ordersByStatus.map((_, i) => this.palette[i % this.palette.length]),
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverOffset: 8,
      }],
    };
  });

  readonly chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1c18',
        titleFont: { family: 'Inter', size: 12, weight: '600' },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: { label: (ctx: any) => `EGP ${ctx.parsed.y.toFixed(2)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8c8375', maxRotation: 45 } },
      y: { beginAtZero: true, grid: { color: 'rgba(31,28,24,0.06)', drawBorder: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8c8375', callback: (v: any) => `EGP ${v}` } },
    },
  };

  readonly barChartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1c18',
        titleFont: { family: 'Inter', size: 12, weight: '600' },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: { label: (ctx: any) => `EGP ${ctx.parsed.y.toFixed(2)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8c8375' } },
      y: { beginAtZero: true, grid: { color: 'rgba(31,28,24,0.06)', drawBorder: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8c8375', callback: (v: any) => `EGP ${v}` } },
    },
  };

  readonly doughnutOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: { family: 'Inter', size: 12, weight: '500' },
          color: '#544d43',
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#1f1c18',
        titleFont: { family: 'Inter', size: 12, weight: '600' },
        bodyFont: { family: 'Inter', size: 13 },
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: any) => {
            const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
            return ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
          },
        },
      },
    },
  };

  ngOnInit(): void {
    this.revenueService.startPolling(30_000);
  }
}
