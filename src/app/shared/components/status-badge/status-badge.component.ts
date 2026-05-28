import { Component, computed, input } from '@angular/core';

export type StatusBadgeTone = 'neutral' | 'success' | 'warning' | 'info' | 'danger' | 'brand';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<StatusBadgeTone>('neutral');
  readonly size = input<'sm' | 'md'>('md');

  readonly badgeClass = computed(() => `fm-badge fm-badge-${this.tone()} fm-badge-${this.size()}`);
}

