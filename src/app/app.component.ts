import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel } from '@angular/router';
import { GlobalLoader } from './core/components/global-loader/global-loader.component';
import { QuickViewModalComponent } from './features/products/components/quick-view-modal/quick-view-modal.component';
import { DeliverySuccessModalComponent } from './core/components/delivery-success-modal/delivery-success-modal.component';
import { CartService } from './features/cart/services/cart.service';
import { DeliveryCelebrationService } from './core/services/delivery-celebration.service';
import { LoadingService } from './core/services/loading.service';

import { PlatformService } from './core/services/platform.service';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader, QuickViewModalComponent, DeliverySuccessModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  private readonly cartService = inject(CartService);
  private readonly deliveryCelebration = inject(DeliveryCelebrationService);
  protected readonly loadingService = inject(LoadingService);
  private readonly platformService = inject(PlatformService);

  private readonly router = inject(Router);

  constructor() {
    this.cartService.resetUiState();
    if (this.platformService.isNative()) {
      GoogleAuth.initialize();
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        console.log(`[Diagnostic] Global Router NavigationStart: window.location.href = ${typeof window !== 'undefined' ? window.location.href : 'SSR'}, router.url = ${this.router.url}, Target = ${event.url}`);
      }
      if (event instanceof NavigationEnd) {
        console.log(`[Diagnostic] Global Router NavigationEnd: window.location.href = ${typeof window !== 'undefined' ? window.location.href : 'SSR'}, router.url = ${this.router.url}, Final = ${event.urlAfterRedirects}`);
      }
      if (event instanceof NavigationCancel) {
        console.log(`[Diagnostic] Global Router NavigationCancel: window.location.href = ${typeof window !== 'undefined' ? window.location.href : 'SSR'}, router.url = ${this.router.url}, Cancelled = ${event.url}, Reason = ${event.reason}`);
      }
    });
    if (this.platformService.isNative()) {
      GoogleAuth.initialize();
    }
  }

  protected readonly title = signal('furniture-ai');
}
