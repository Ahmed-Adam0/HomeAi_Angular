import { Component } from '@angular/core';
import { OrdersTable } from '../../components';

@Component({
  selector: 'app-vendor-orders',
  standalone: true,
  imports: [OrdersTable],
  templateUrl: './vendor-orders.component.html',
  styleUrl: './vendor-orders.component.css',
})
export class VendorOrders {}
