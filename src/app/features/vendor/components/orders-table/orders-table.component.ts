import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IVendorOrder } from '../../interfaces';
import { OrderStatusBadge } from '../order-status-badge/order-status-badge.component';

@Component({
  selector: 'app-orders-table',
  standalone: true,
  imports: [DatePipe, CurrencyFormatPipe, OrderStatusBadge, TranslatePipe],
  templateUrl: './orders-table.component.html',
  styleUrl: './orders-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersTable {
  readonly orders = input.required<IVendorOrder[]>();
  readonly viewOrder = output<string>();

  protected onViewOrder(orderId: string): void {
    this.viewOrder.emit(orderId);
  }
}
