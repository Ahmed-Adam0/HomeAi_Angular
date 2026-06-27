import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
export class App {
  private readonly cartService = inject(CartService);
  private readonly deliveryCelebration = inject(DeliveryCelebrationService);
  protected readonly loadingService = inject(LoadingService);

  constructor() {
    this.cartService.resetUiState();
  }

  protected readonly title = signal('furniture-ai');
}
