import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  imports: [],
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.css'
})
export class SkeletonLoader {
  @Input() type: 'text' | 'card' | 'circle' | 'list' = 'card';
  @Input() count = 1;

  get arrayFromCount(): number[] {
    return Array(this.count).fill(0);
  }
}
