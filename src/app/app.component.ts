import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { GlobalLoader } from './core/components/global-loader/global-loader.component';
import { QuickViewModalComponent } from './features/products/components/quick-view-modal/quick-view-modal.component';
import { DeliverySuccessModalComponent } from './core/components/delivery-success-modal/delivery-success-modal.component';
import { CartService } from './features/cart/services/cart.service';
import { DeliveryCelebrationService } from './core/services/delivery-celebration.service';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoader, QuickViewModalComponent, DeliverySuccessModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly deliveryCelebration = inject(DeliveryCelebrationService);
  protected readonly loadingService = inject(LoadingService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  constructor() {
    this.cartService.resetUiState();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Intercept Paymob Hash redirects since the app uses PathLocationStrategy
      const hash = window.location.hash;
      if (hash.includes('#/payment/success') || hash.includes('#/payment/failed')) {
        const search = window.location.search;
        const params = new URLSearchParams(search);
        const queryParams: any = {};
        params.forEach((value, key) => {
          queryParams[key] = value;
        });

        const targetRoute = hash.includes('success') ? '/payment/success' : '/payment/failed';
        this.router.navigate([targetRoute], { queryParams, replaceUrl: true });
      }
    }
  }

  protected readonly title = signal('furniture-ai');
}
