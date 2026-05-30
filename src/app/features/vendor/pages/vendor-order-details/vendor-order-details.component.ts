import { Component } from '@angular/core';
import { OrderStatusBadge } from '../../components';

@Component({
  selector: 'app-vendor-order-details',
  standalone: true,
  imports: [OrderStatusBadge],
  templateUrl: './vendor-order-details.component.html',
  styleUrl: './vendor-order-details.component.css',
})
export class VendorOrderDetails {}
