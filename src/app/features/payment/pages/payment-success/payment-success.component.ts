import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { OrdersApiService } from '../../../orders/data-access/orders-api.service';
import { IOrder } from '../../../orders/interfaces';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { Button } from '../../../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

export interface TimelineStep {
  key: string;
  labelKey: string;
  isComplete: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    DatePipe,
    TranslatePipe,
    CurrencyFormatPipe,
    RtlDirective,
    Button,
    StatusBadgeComponent
  ],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersApiService = inject(OrdersApiService);

  // Parameter state signals
  readonly success = signal<string | null>(null);
  readonly merchantOrderId = signal<string | null>(null);
  readonly isValidated = signal<boolean>(false);
  readonly isLoadingOrder = signal<boolean>(false);

  // Order state signals
  readonly orderData = signal<IOrder | null>(null);
  readonly transactionRef = signal<string>('');

  // Computed fields
  readonly orderNumber = computed(() => {
    return this.orderData()?.orderNumber || this.merchantOrderId() || '—';
  });

  readonly purchaseDate = computed(() => {
    return this.orderData() ? new Date(this.orderData()!.createdAt) : new Date();
  });

  readonly totalAmount = computed(() => {
    return this.orderData()?.totalAmount || null;
  });

  // Timeline Steps
  readonly timelineSteps = computed<TimelineStep[]>(() => {
    // Standard sequence: Payment Confirmed (step 1), Order Processing (step 2), Vendor Prep, Shipping, Delivery
    // The first step (Payment Confirmed) is completed and highlighted.
    // If order is loaded and status is further along, we update the timeline accordingly.
    const status = this.orderData()?.status || 'pending';
    
    return [
      {
        key: 'confirmed',
        labelKey: 'PAYMENT_SUCCESS.TIMELINE.STEP1',
        isComplete: true,
        isActive: status === 'pending'
      },
      {
        key: 'processing',
        labelKey: 'PAYMENT_SUCCESS.TIMELINE.STEP2',
        isComplete: status === 'processing' || status === 'shipped' || status === 'delivered',
        isActive: status === 'processing'
      },
      {
        key: 'vendor_prep',
        labelKey: 'PAYMENT_SUCCESS.TIMELINE.STEP3',
        isComplete: status === 'shipped' || status === 'delivered',
        isActive: false // Future step
      },
      {
        key: 'shipping',
        labelKey: 'PAYMENT_SUCCESS.TIMELINE.STEP4',
        isComplete: status === 'delivered',
        isActive: status === 'shipped'
      },
      {
        key: 'delivery',
        labelKey: 'PAYMENT_SUCCESS.TIMELINE.STEP5',
        isComplete: false,
        isActive: status === 'delivered'
      }
    ];
  });

  ngOnInit(): void {
    // Read query params from route snapshot synchronously to prevent initial render flicker
    const successParam = this.route.snapshot.queryParamMap.get('success');
    const orderIdParam = this.route.snapshot.queryParamMap.get('merchant_order_id');

    this.success.set(successParam);
    this.merchantOrderId.set(orderIdParam);

    // Validation rules: If success !== 'true', immediately redirect to /payment/failed
    if (successParam !== 'true') {
      this.router.navigate(['/payment/failed'], { replaceUrl: true });
      return;
    }

    // Set validation pass
    this.isValidated.set(true);

    // Generate a premium random transaction reference for Stripe/Paymob callback confirmation
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transactionRef.set(`TXN-${orderIdParam || '100'}-${randomHex}`);

    // If merchant_order_id is available, fetch details from backend
    if (orderIdParam) {
      this.fetchOrderDetails(orderIdParam);
    }
  }

  private fetchOrderDetails(orderId: string): void {
    this.isLoadingOrder.set(true);
    this.ordersApiService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.orderData.set(order);
        this.isLoadingOrder.set(false);
      },
      error: (error) => {
        console.error('Failed to load order info, using fallback presentation.', error);
        this.isLoadingOrder.set(false);
      }
    });
  }

  viewOrders(): void {
    this.router.navigate(['/orders']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
