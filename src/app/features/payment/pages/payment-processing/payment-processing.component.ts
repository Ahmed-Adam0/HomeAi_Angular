import { Component, inject, OnInit, signal } from '@angular/core';
import { PaymentService } from '../../services/payment.service';
import { IPaymentIntent, IPaymentMethod, PaymentProvider } from '../../interfaces/ipayment';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { AlertComponent } from '../../../../shared/components/alert/alert.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-payment-processing-page',
  imports: [LoadingSpinner, AlertComponent],
  templateUrl: './payment-processing.component.html',
  styleUrl: './payment-processing.component.css'
})
export class PaymentProcessingComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private router = inject(Router);

  readonly paymentMethods = signal<IPaymentMethod[]>([]);
  readonly selectedProvider = signal<PaymentProvider>('stripe');
  readonly processing = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');

  ngOnInit(): void {
    this.paymentMethods.set(this.paymentService.paymentMethods());
  }

  selectProvider(provider: PaymentProvider): void {
    this.selectedProvider.set(provider);
  }

  pay(): void {
    this.processing.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.paymentService.createPaymentIntent(249.99, 'USD', this.selectedProvider()).subscribe({
      next: (intent) => {
        setTimeout(() => {
          this.paymentService.processPayment(intent.transactionId).subscribe((res) => {
            this.processing.set(false);
            if (res.success) {
              this.successMessage.set(res.message);
              setTimeout(() => {
                this.router.navigate(['/orders']);
              }, 2000);
            } else {
              this.errorMessage.set('Payment failed. Please retry.');
            }
          });
        }, 1500);
      },
      error: () => {
        this.processing.set(false);
        this.errorMessage.set('Could not initialize transaction.');
      }
    });
  }
}
