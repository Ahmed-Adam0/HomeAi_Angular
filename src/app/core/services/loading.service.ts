import { Injectable, signal, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private readonly router = inject(Router);
  
  // Reactive Signal representing global loading state
  readonly isLoading = signal<boolean>(false);
  
  // Timeout reference to debounce short navigations
  private debounceTimeout: any = null;

  constructor() {
    this.initRouterListener();
  }

  /**
   * Manually sets loading state to active.
   */
  show(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    this.isLoading.set(true);
  }

  /**
   * Manually terminates loading state.
   */
  hide(): void {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
      this.debounceTimeout = null;
    }
    this.isLoading.set(false);
  }

  /**
   * Subscribes to router events and manages the transitions.
   */
  private initRouterListener(): void {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        // Debounce: Only show global loader if transition takes longer than 150ms
        this.debounceTimeout = setTimeout(() => {
          this.isLoading.set(true);
        }, 150);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.hide();
      }
    });
  }
}
