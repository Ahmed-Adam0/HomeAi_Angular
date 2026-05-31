import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { OrderStatusBadge } from '../../components';
import { IVendorOrder } from '../../interfaces';

@Component({
  selector: 'app-vendor-order-details',
  standalone: true,
  imports: [CommonModule, OrderStatusBadge, TranslatePipe],
  templateUrl: './vendor-order-details.component.html',
  styleUrl: './vendor-order-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorOrderDetails {
  readonly order = signal<IVendorOrder | null>(null);

  protected readonly skeletonItems = Array(3);
}
