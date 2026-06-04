import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import { OrdersFacade, OrderListItemVm } from '../../data-access/orders.facade';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { LoadingSpinner } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { Button } from '../../../../shared/components/button/button.component';
import { StatusBadgeComponent, StatusBadgeTone } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';
import { RtlDirective } from '../../../../shared/directives/rtl.directive';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    UpperCasePipe,
    PageHeaderComponent,
    LoadingSpinner,
    EmptyStateComponent,
    Button,
    StatusBadgeComponent,
    TranslatePipe,
    CurrencyFormatPipe,
    RtlDirective,
    SkeletonLoader
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [OrdersFacade],
})
export class Orders implements OnInit {
  readonly facade = inject(OrdersFacade);

  ngOnInit(): void {
    this.facade.loadOrders();
  }

  trackById(_: number, item: OrderListItemVm): string {
    return item.id;
  }

  /**
   * Delegates the order status tone calculation to the business logic layer (facade).
   */
  orderStatusTone(status: OrderListItemVm['orderStatus']): StatusBadgeTone {
    return this.facade.orderStatusTone(status);
  }

  /**
   * Delegates the payment status tone calculation to the business logic layer (facade).
   */
  paymentStatusTone(status: OrderListItemVm['paymentStatus']): StatusBadgeTone {
    return this.facade.paymentStatusTone(status);
  }
}
