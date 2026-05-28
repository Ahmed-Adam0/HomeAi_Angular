import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TimelineStepVm } from '../../data-access/orders.facade';
import { OrderStatus } from '../../interfaces';

@Component({
  selector: 'app-order-timeline',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  templateUrl: './order-timeline.component.html',
  styleUrl: './order-timeline.component.css',
})
export class OrderTimelineComponent {
  readonly steps = input.required<TimelineStepVm[]>();
  readonly status = input<OrderStatus | null>(null);

  readonly isCancelled = computed(() => {
    const s = this.status();
    return s === 'cancelled' || s === 'refunded';
  });

  readonly stepClass = computed(() => {
    const steps = this.steps();
    const cancelled = this.isCancelled();
    
    return steps.map((s) => {
      // If cancelled, make all steps complete/active lose primary gold styling and instead be styled in red/danger or muted
      return {
        ...s,
        cls: {
          'fm-tl-step': true,
          'is-complete': cancelled ? false : s.isComplete,
          'is-active': cancelled ? false : s.isActive,
          'is-cancelled': cancelled,
        },
        labelKey: `ORDERS_TIMELINE_${s.key.toUpperCase()}`,
      };
    });
  });
}

