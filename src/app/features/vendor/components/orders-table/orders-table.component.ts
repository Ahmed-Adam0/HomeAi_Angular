import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { IOrder } from '../../../orders/interfaces/iorder';

import { OrderStatusBadge } from '../order-status-badge/order-status-badge.component';
import { VendorOrderStatus } from '../../models/vendor-order-status.enum';

@Component({
  selector: 'app-orders-table',
  standalone: true,
  imports: [DatePipe, CurrencyFormatPipe, OrderStatusBadge, TranslatePipe],
  templateUrl: './orders-table.component.html',
  styleUrl: './orders-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersTable {
  readonly orders = input.required<IOrder[]>();
  readonly viewOrder = output<string>();

  protected onViewOrder(orderId: string): void {
    this.viewOrder.emit(orderId);
  }

  protected getVendorOrderStatus(status: string): VendorOrderStatus {
    return status as VendorOrderStatus;
  }
}
