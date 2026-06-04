import { Component, Input } from '@angular/core';

export type SkeletonType = 
  | 'text'
  | 'card'
  | 'circle'
  | 'list'
  | 'product-details-gallery'
  | 'product-details-info'
  | 'order-card'
  | 'order-details'
  | 'profile'
  | 'notification'
  | 'kpi-card'
  | 'chart-container'
  | 'revenue-card'
  | 'vendor-dashboard';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.css'
})
export class SkeletonLoader {
  @Input() type: SkeletonType = 'card';
  @Input() count = 1;

  get arrayFromCount(): number[] {
    return Array(this.count).fill(0);
  }
}
