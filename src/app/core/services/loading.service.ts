import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly router = inject(Router);
  
  // Reactive Signal representing global loading state
  private readonly _isLoading = signal<boolean>(false);
  readonly isLoading = this._isLoading.asReadonly();
  
  private readonly pendingTasks = signal<number>(0);
  private readonly isNavigating = signal<boolean>(false);
  private readonly manualLoading = signal<boolean>(false);

  private loadingStartTime = 0;
  private hideTimeout: any = null;

  constructor() {
    this.initRouterListener();
  }

  /**
   * Registers a pending asynchronous task (e.g. API request, translation loading).
   * Returns a completion callback function.
   */
  addInitTask(): () => void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.pendingTasks.update(n => n + 1);
    this.checkLoadingState();

    let completed = false;
    return () => {
      if (!completed) {
        completed = true;
        this.pendingTasks.update(n => Math.max(0, n - 1));
        this.checkLoadingState();
      }
    };
  }

  /**
   * Manually sets loading state to active.
   */
  show(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.manualLoading.set(true);
    this.checkLoadingState();
  }

  /**
   * Manually terminates loading state.
   */
  hide(): void {
    this.manualLoading.set(false);
    this.checkLoadingState();
  }

  /**
   * Evaluates the active signals to decide if the global loader should be shown or hidden,
   * enforcing a minimum display duration of 300ms to eliminate visual flicker.
   */
  private checkLoadingState(): void {
    const shouldLoad = this.isNavigating() || this.pendingTasks() > 0 || this.manualLoading();

    if (shouldLoad) {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
      if (!this._isLoading()) {
        this.loadingStartTime = Date.now();
        this._isLoading.set(true);
      }
    } else {
      if (this._isLoading()) {
        const elapsed = Date.now() - this.loadingStartTime;
        const minDuration = 300; // 300ms minimum loader display time

        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }

        if (elapsed < minDuration) {
          const remaining = minDuration - elapsed;
          this.hideTimeout = setTimeout(() => {
            if (!this.isNavigating() && this.pendingTasks() === 0 && !this.manualLoading()) {
              this._isLoading.set(false);
            }
            this.hideTimeout = null;
          }, remaining);
        } else {
          this._isLoading.set(false);
        }
      }
    }
  }

  /**
   * Subscribes to router events and manages the transitions.
   */
  private initRouterListener(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.isNavigating.set(true);
        this.checkLoadingState();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigating.set(false);
        this.checkLoadingState();
      }
    });
  }
}

