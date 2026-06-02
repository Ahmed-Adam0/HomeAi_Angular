import { Injectable, inject, signal, DestroyRef, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, interval, Subject, throwError } from 'rxjs';
import { map, takeUntil, tap, switchMap, startWith, catchError } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { unwrap } from '../../../core/utils/api-utils';
import { IRevenueAnalytics } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class VendorRevenueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private readonly destroyRef = inject(DestroyRef);

  private readonly revenueState = signal<IRevenueAnalytics | null>(null);
  private readonly loadingState = signal<boolean>(true);
  private readonly errorState = signal<string | null>(null);
  private readonly filterState = signal<{ startDate?: string; endDate?: string }>({});

  readonly revenueSignal = this.revenueState.asReadonly();
  readonly loadingSignal = this.loadingState.asReadonly();
  readonly errorSignal = this.errorState.asReadonly();
  readonly filterSignal = this.filterState.asReadonly();

  private lastFetch = 0;
  private readonly CACHE_TTL = 30_000;
  private readonly stopPolling$ = new Subject<void>();

  fetchRevenueAnalytics(startDate?: string, endDate?: string): Observable<IRevenueAnalytics> {
    const now = Date.now();
    const hasFilter = !!startDate || !!endDate;

    if (!hasFilter && this.revenueState() && now - this.lastFetch < this.CACHE_TTL) {
      this.loadingState.set(false);
      return new Observable<IRevenueAnalytics>((observer) => {
        observer.next(this.revenueState()!);
        observer.complete();
      });
    }

    this.loadingState.set(true);
    this.errorState.set(null);
    this.filterState.set({ startDate, endDate });

    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<IRevenueAnalytics>(
      `${this.apiUrl}${API_URLS.VENDOR.REVENUE_ANALYTICS}`,
      { params }
    ).pipe(
      map((res) => unwrap<IRevenueAnalytics>(res)),
      tap({
        next: (data) => {
          this.revenueState.set(data);
          this.loadingState.set(false);
          if (!hasFilter) this.lastFetch = now;
        },
      }),
      catchError((err: HttpErrorResponse) => {
        this.loadingState.set(false);
        if (err.status !== 401) {
          this.errorState.set(err?.message ?? 'Failed to load revenue analytics');
        }
        return throwError(() => err);
      })
    );
  }

  refreshRevenueData(): void {
    this.lastFetch = 0;
    const f = this.filterState();
    this.fetchRevenueAnalytics(f.startDate, f.endDate)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  startPolling(intervalMs = 30_000): void {
    this.stopPolling();
    this.filterState.set({});
    interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.fetchRevenueAnalytics()),
      takeUntil(this.stopPolling$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  stopPolling(): void {
    this.stopPolling$.next();
  }

  purgeCache(): void {
    this.lastFetch = 0;
  }
}
