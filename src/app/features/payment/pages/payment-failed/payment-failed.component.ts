import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { Button } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-payment-failed',
  standalone: true,
  imports: [RouterLink, TranslatePipe, RtlDirective, Button],
  templateUrl: './payment-failed.component.html',
  styleUrl: './payment-failed.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentFailedComponent {
  private router = inject(Router);

  retryCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  backToCart(): void {
    this.router.navigate(['/cart']);
  }

  viewOrders(): void {
    this.router.navigate(['/orders']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
