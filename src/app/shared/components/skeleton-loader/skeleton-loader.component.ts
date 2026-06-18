import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';

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
  imports: [NgFor],
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
