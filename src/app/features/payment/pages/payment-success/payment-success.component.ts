import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { OrdersFacade } from '../../../orders/data-access/orders.facade';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { Button } from '../../../../shared/components/button/button.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { StatusTranslationPipe } from '../../../../shared/pipes/status-translation.pipe';

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
    StatusBadgeComponent,
    SkeletonLoader,
    StatusTranslationPipe
  ],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css',
  providers: [OrdersFacade],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly facade = inject(OrdersFacade);
  readonly translationService = inject(TranslationService);

  // Parameter state signals
  readonly success = signal<string | null>(null);
  readonly merchantOrderId = signal<string | null>(null);
  readonly isValidated = signal<boolean>(false);
  readonly transactionRef = signal<string>('');

  // Computed fields
  readonly order = computed(() => this.facade.selectedOrder());

  readonly orderNumber = computed(() => {
    return this.order()?.orderNumber || this.merchantOrderId() || '—';
  });

  readonly purchaseDate = computed(() => {
    return this.order() ? new Date(this.order()!.createdAt) : new Date();
  });

  readonly paidInThisTransaction = computed(() => {
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    if (amountParam) {
      const parsed = parseFloat(amountParam);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    const milestones = this.facade.enrichedMilestones();
    const paidMilestones = milestones.filter((m: any) => m.isPaid && m.paidAt);
    if (paidMilestones.length > 0) {
      const sorted = [...paidMilestones].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
      return sorted[0].amount;
    }

    return this.facade.amountPaid();
  });

  // Timeline Steps mapped from the facade's calculations
  readonly timelineSteps = computed<TimelineStep[]>(() => {
    const orderData = this.order();
    if (!orderData) return [];
    
    const steps = this.facade.timelineFor(orderData);
    const stepLabels = [
      'PAYMENT_SUCCESS.TIMELINE.STEP1',
      'PAYMENT_SUCCESS.TIMELINE.STEP2',
      'PAYMENT_SUCCESS.TIMELINE.STEP3',
      'PAYMENT_SUCCESS.TIMELINE.STEP4',
      'PAYMENT_SUCCESS.TIMELINE.STEP5'
    ];

    return steps.slice(0, 5).map((step, index) => ({
      key: step.key,
      labelKey: stepLabels[index] || `STATUS_${step.key.toUpperCase()}`,
      isComplete: step.isComplete,
      isActive: step.isActive
    }));
  });

  ngOnInit(): void {
    const successParam = this.route.snapshot.queryParamMap.get('success');
    const orderIdParam = this.route.snapshot.queryParamMap.get('merchant_order_id');

    this.success.set(successParam);
    this.merchantOrderId.set(orderIdParam);

    if (successParam !== 'true') {
      this.router.navigate(['/payment/failed'], { replaceUrl: true });
      return;
    }

    this.isValidated.set(true);

    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.transactionRef.set(`TXN-${orderIdParam || '100'}-${randomHex}`);

    if (orderIdParam) {
      this.facade.loadOrderDetails(orderIdParam, true);
    }
  }

  retryLoad(): void {
    const orderId = this.merchantOrderId();
    if (orderId) {
      this.facade.loadOrderDetails(orderId, true);
    }
  }

  viewOrders(): void {
    this.router.navigate(['/orders']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }
}
