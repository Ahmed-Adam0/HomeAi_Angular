import { Component, computed, input } from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-invoice-summary',
  standalone: true,
  imports: [CurrencyFormatPipe, TranslatePipe],
  templateUrl: './invoice-summary.component.html',
  styleUrl: './invoice-summary.component.css',
})
export class InvoiceSummaryComponent {
  readonly shippingCost = input.required<number>();
  readonly taxAmount = input.required<number>();
  readonly discountAmount = input.required<number>();
  readonly totalAmount = input.required<number>();

  readonly subtotal = computed(() => {
    return this.totalAmount() - this.shippingCost() - this.taxAmount() + this.discountAmount();
  });
}

