import { Component } from '@angular/core';
import { RevenueCards } from '../../components';

@Component({
  selector: 'app-vendor-revenue',
  standalone: true,
  imports: [RevenueCards],
  templateUrl: './vendor-revenue.component.html',
  styleUrl: './vendor-revenue.component.css',
})
export class VendorRevenue {}
