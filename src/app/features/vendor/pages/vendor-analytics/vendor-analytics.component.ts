import { Component } from '@angular/core';
import { AnalyticsCards } from '../../components';

@Component({
  selector: 'app-vendor-analytics',
  standalone: true,
  imports: [AnalyticsCards],
  templateUrl: './vendor-analytics.component.html',
  styleUrl: './vendor-analytics.component.css',
})
export class VendorAnalytics {}
