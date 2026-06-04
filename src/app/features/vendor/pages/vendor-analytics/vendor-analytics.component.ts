import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UIChart } from 'primeng/chart';
import { DatePicker } from 'primeng/datepicker';
import { ProgressBar } from 'primeng/progressbar';
import { VendorOrderAnalyticsService } from '../../services/vendor-order-analytics.service';
import { IOrderAnalytics } from '../../interfaces';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

interface KpiCard {
  key: string;
  labelKey: string;
  icon: string;
  subtitleKey: string;
  isCurrency: boolean;
  isPercent: boolean;
  isHours: boolean;
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
  selector: 'app-vendor-analytics',
  standalone: true,
  imports: [UIChart, DatePicker, FormsModule, CurrencyPipe, DatePipe, CurrencyFormatPipe, ProgressBar, TranslatePipe],
  providers: [CurrencyFormatPipe, DatePipe],
  templateUrl: './vendor-analytics.component.html',
  styleUrl: './vendor-analytics.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorAnalytics implements OnInit {
  protected readonly analyticsService = inject(VendorOrderAnalyticsService);
  private readonly currencyFormat = inject(CurrencyFormatPipe);
  private readonly datePipe = inject(DatePipe);

  readonly data = this.analyticsService.analyticsSignal;
  readonly loading = this.analyticsService.loadingSignal;
  readonly error = this.analyticsService.errorSignal;

  readonly skeletonSlots = [0, 1, 2, 3];

  readonly lastUpdated = computed(() => {
    this.data();
    return new Date().toLocaleTimeString();
  });

  /* ---------- Date Range Filter ---------- */

  readonly dateRange = signal<Date[] | null>(null);
  readonly activeFilterKey = signal<string>('all');

  readonly quickFilters: QuickFilter[] = [
    { key: 'today', labelKey: 'VENDOR.ORDERS_ANALYTICS.FILTER_TODAY', days: 0 },
    { key: 'last7', labelKey: 'VENDOR.ORDERS_ANALYTICS.FILTER_7_DAYS', days: 7 },
    { key: 'last30', labelKey: 'VENDOR.ORDERS_ANALYTICS.FILTER_30_DAYS', days: 30 },
    { key: 'thisMonth', labelKey: 'VENDOR.ORDERS_ANALYTICS.FILTER_THIS_MONTH', days: 'month' },
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
    this.analyticsService.stopPolling();
    this.analyticsService.fetchOrderAnalytics(start, end)
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
    this.analyticsService.stopPolling();
    this.analyticsService.fetchOrderAnalytics(
      toRfc3339Start(start),
      toRfc3339(end),
    ).subscribe();
    this.activeFilterKey.set(filter.key);
  }

  clearDateFilter(): void {
    this.dateRange.set(null);
    this.activeFilterKey.set('all');
    this.analyticsService.purgeCache();
    this.analyticsService.startPolling(30_000);
  }

  /* ---------- KPI cards ---------- */

  readonly kpiCards: KpiCard[] = [
    { key: 'totalOrders', labelKey: 'VENDOR.ORDERS_ANALYTICS.KPI_TOTAL_ORDERS', icon: 'bi bi-box-seam', subtitleKey: 'VENDOR.ORDERS_ANALYTICS.KPI_TOTAL_ORDERS_SUB', isCurrency: false, isPercent: false, isHours: false },
    { key: 'completionRate', labelKey: 'VENDOR.ORDERS_ANALYTICS.KPI_COMPLETION_RATE', icon: 'bi bi-check2-circle', subtitleKey: 'VENDOR.ORDERS_ANALYTICS.KPI_COMPLETION_RATE_SUB', isCurrency: false, isPercent: true, isHours: false },
    { key: 'averageOrderValue', labelKey: 'VENDOR.ORDERS_ANALYTICS.KPI_AVG_ORDER_VALUE', icon: 'bi bi-cash-stack', subtitleKey: 'VENDOR.ORDERS_ANALYTICS.KPI_AVG_ORDER_VALUE_SUB', isCurrency: true, isPercent: false, isHours: false },
    { key: 'averageCompletionTimeHours', labelKey: 'VENDOR.ORDERS_ANALYTICS.KPI_AVG_COMPLETION_TIME', icon: 'bi bi-clock-history', subtitleKey: 'VENDOR.ORDERS_ANALYTICS.KPI_AVG_COMPLETION_TIME_SUB', isCurrency: false, isPercent: false, isHours: true },
  ];

  private readonly rawValues = computed<Record<string, number>>(() => {
    const d = this.data();
    if (!d) return {} as Record<string, number>;
    return {
      totalOrders: d.totalOrders,
      completionRate: d.completionRate,
      averageOrderValue: d.averageOrderValue,
      averageCompletionTimeHours: d.averageCompletionTimeHours,
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
        current[key] = key === 'averageOrderValue'
          ? Math.round(v * 100) / 100
          : key === 'completionRate' || key === 'averageCompletionTimeHours'
            ? Math.round(v * 10) / 10
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
    if (val === undefined) {
      if (card.isCurrency) return this.currencyFormat.transform(0);
      if (card.isPercent) return '0%';
      if (card.isHours) return '0h';
      return '0';
    }
    if (card.isCurrency) return this.currencyFormat.transform(val);
    if (card.isPercent) return `${val}%`;
    if (card.isHours) return `${val}h`;
    return String(val);
  }

  /* ---------- Charts ---------- */

  private readonly palette = ['#b8935c', '#657e5d', '#5c7f93', '#ad5c51'];

  readonly doughnutChartData = computed(() => {
    const d = this.data();
    if (!d) return null;
    const labels: string[] = [];
    const counts: number[] = [];
    const colors: string[] = [];
    const statuses: { label: string; key: keyof IOrderAnalytics; color: string }[] = [
      { label: 'Completed', key: 'completedOrders', color: this.palette[0] },
      { label: 'Pending', key: 'pendingOrders', color: this.palette[1] },
      { label: 'In Progress', key: 'inProgressOrders', color: this.palette[2] },
      { label: 'Cancelled', key: 'cancelledOrders', color: this.palette[3] },
    ];
    for (const s of statuses) {
      const count = Number(d[s.key]);
      if (count > 0) {
        labels.push(s.label);
        counts.push(count);
        colors.push(s.color);
      }
    }
    if (counts.length === 0) return null;
    return {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: colors,
        borderWidth: 3,
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 4,
        hoverOffset: 8,
      }],
    };
  });

  readonly barChartData = computed(() => {
    const d = this.data();
    if (!d) return null;
    const labels: string[] = [];
    const counts: number[] = [];
    const colors: string[] = [];
    const statuses: { label: string; key: keyof IOrderAnalytics; color: string }[] = [
      { label: 'Completed', key: 'completedOrders', color: this.palette[0] },
      { label: 'Pending', key: 'pendingOrders', color: this.palette[1] },
      { label: 'In Progress', key: 'inProgressOrders', color: this.palette[2] },
      { label: 'Cancelled', key: 'cancelledOrders', color: this.palette[3] },
    ];
    for (const s of statuses) {
      const count = Number(d[s.key]);
      labels.push(s.label);
      counts.push(count);
      colors.push(s.color + 'D4');
    }
    return {
      labels,
      datasets: [{
        label: 'Orders',
        data: counts,
        backgroundColor: colors,
        borderColor: this.palette.map(c => c),
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      }],
    };
  });

  readonly chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
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
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8c8375' } },
      y: { beginAtZero: true, grid: { color: 'rgba(31,28,24,0.06)', drawBorder: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#8c8375', stepSize: 1 } },
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

  /* ---------- Performance Metrics ---------- */

  readonly performanceMetrics = computed(() => {
    const d = this.data();
    if (!d) return null;
    const orderSuccessRate = d.totalOrders > 0
      ? Math.round((d.completedOrders / d.totalOrders) * 100)
      : 0;
    return {
      completionRate: Math.round(d.completionRate),
      orderSuccessRate,
      completedOrders: d.completedOrders,
      totalOrders: d.totalOrders,
    };
  });

  getPerformanceColor(rate: number): string {
    if (rate >= 80) return '#657e5d';
    if (rate >= 50) return '#b8935c';
    return '#ad5c51';
  }

  ngOnInit(): void {
    this.analyticsService.startPolling(30_000);
  }
}
