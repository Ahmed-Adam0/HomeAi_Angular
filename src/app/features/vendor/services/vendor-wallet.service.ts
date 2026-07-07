import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { API_URLS } from '../../../core/constants';
import { unwrap } from '../../../core/utils/api-utils';
import { IVendorWallet, IVendorWithdrawal, IWithdrawalRequest, IWithdrawalResponse } from '../interfaces';

@Injectable({ providedIn: 'root' })
export class VendorWalletService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  private readonly walletState = signal<IVendorWallet | null>(null);
  private readonly withdrawalsState = signal<IVendorWithdrawal[]>([]);
  private readonly loadingState = signal<boolean>(false);
  private readonly errorState = signal<string | null>(null);

  readonly walletSignal = this.walletState.asReadonly();
  readonly withdrawalsSignal = this.withdrawalsState.asReadonly();
  readonly loadingSignal = this.loadingState.asReadonly();
  readonly errorSignal = this.errorState.asReadonly();

  /**
   * Fetches the vendor wallet summary.
   */
  fetchWallet(): Observable<IVendorWallet> {
    this.loadingState.set(true);
    this.errorState.set(null);
    return this.http.get<IVendorWallet>(
      `${this.apiUrl}${API_URLS.VENDOR.WALLET}`
    ).pipe(
      map((res) => unwrap<IVendorWallet>(res)),
      tap({
        next: (data) => {
          this.walletState.set(data);
          this.loadingState.set(false);
        },
        error: (err) => {
          this.loadingState.set(false);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 401) {
          this.errorState.set(err?.error?.message || 'Failed to load wallet balance.');
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Fetches the vendor withdrawal history.
   */
  fetchWithdrawals(): Observable<IVendorWithdrawal[]> {
    this.loadingState.set(true);
    this.errorState.set(null);
    return this.http.get<IVendorWithdrawal[]>(
      `${this.apiUrl}${API_URLS.VENDOR.WITHDRAWALS}`
    ).pipe(
      map((res) => unwrap<IVendorWithdrawal[]>(res)),
      tap({
        next: (data) => {
          this.withdrawalsState.set(data);
          this.loadingState.set(false);
        },
        error: (err) => {
          this.loadingState.set(false);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 401) {
          this.errorState.set(err?.error?.message || 'Failed to load withdrawal history.');
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Requests a wallet withdrawal.
   */
  requestWithdrawal(request: IWithdrawalRequest): Observable<IWithdrawalResponse> {
    this.loadingState.set(true);
    this.errorState.set(null);
    return this.http.post<IWithdrawalResponse>(
      `${this.apiUrl}${API_URLS.VENDOR.WITHDRAW}`,
      request
    ).pipe(
      map((res) => unwrap<IWithdrawalResponse>(res)),
      tap({
        next: (res) => {
          this.loadingState.set(false);
          if (res.success) {
            // Auto-refresh layout stats
            this.fetchWallet().subscribe();
            this.fetchWithdrawals().subscribe();
          }
        },
        error: (err) => {
          this.loadingState.set(false);
        }
      }),
      catchError((err: HttpErrorResponse) => {
        return throwError(() => err);
      })
    );
  }
}
