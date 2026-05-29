import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { NAV_ROUTES } from '../constants/app-routes';

type AuthRequiredReason = 'login' | 'role' | 'subscription' | 'blocked' | 'guest-checkout';

interface AuthRequiredDialogState {
  visible: boolean;
  reason: AuthRequiredReason;
  title: string;
  message: string;
  returnUrl: string;
  confirmText: string;
  cancelText: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthRequiredService {
  private readonly platformId = inject(PLATFORM_ID);
  private currentResponse: Subject<boolean> | null = null;
  readonly dialogState = signal<AuthRequiredDialogState | null>(null);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  requestAuthRequired(returnUrl: string, reason: AuthRequiredReason = 'login'): Observable<boolean> {
    if (!this.isBrowser) {
      return of(true);
    }

    this.resetPendingResponse();
    this.currentResponse = new Subject<boolean>();
    this.dialogState.set(this.buildDialogState(reason, returnUrl));

    return this.currentResponse.pipe(
      take(1),
      tap(() => this.closeDialog())
    );
  }

  confirm(): void {
    this.sendResponse(true);
  }

  cancel(): void {
    this.sendResponse(false);
  }

  navigateToLogin(returnUrl: string): void {
    if (!this.isBrowser) {
      return;
    }

    window.location.href = `${NAV_ROUTES.LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}`;
  }

  private buildDialogState(reason: AuthRequiredReason, returnUrl: string): AuthRequiredDialogState {
    const title = reason === 'role'
      ? 'Permission Required'
      : reason === 'subscription'
      ? 'Subscription Required'
      : reason === 'blocked'
      ? 'Account Restricted'
      : reason === 'guest-checkout'
      ? 'Login Required'
      : 'Login Required';

    const message = reason === 'role'
      ? 'Your current role does not allow this action. Please login with an authorized account.'
      : reason === 'subscription'
      ? 'A premium plan is required for this action. Please login to continue.'
      : reason === 'blocked'
      ? 'Your account is currently restricted. Please login or contact support.'
      : reason === 'guest-checkout'
      ? 'Please login to complete checkout.'
      : 'Please login to continue with this action.';

    return {
      visible: true,
      reason,
      title,
      message,
      returnUrl,
      confirmText: 'Login',
      cancelText: 'Cancel'
    };
  }

  private sendResponse(value: boolean): void {
    if (!this.currentResponse) {
      return;
    }

    this.currentResponse.next(value);
    this.currentResponse.complete();
    this.currentResponse = null;
  }

  private resetPendingResponse(): void {
    if (!this.currentResponse) {
      return;
    }

    this.currentResponse.next(false);
    this.currentResponse.complete();
    this.currentResponse = null;
  }

  private closeDialog(): void {
    this.dialogState.set(null);
  }
}
