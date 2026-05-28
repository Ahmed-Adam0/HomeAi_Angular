import { Component, computed, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TimelineStepVm } from '../../data-access/orders.facade';

@Component({
  selector: 'app-order-timeline',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  templateUrl: './order-timeline.component.html',
  styleUrl: './order-timeline.component.css',
})
export class OrderTimelineComponent {
  readonly steps = input.required<TimelineStepVm[]>();

  readonly stepClass = computed(() => {
    const steps = this.steps();
    return steps.map((s) => ({
      ...s,
      cls: {
        'fm-tl-step': true,
        'is-complete': s.isComplete,
        'is-active': s.isActive,
      },
      labelKey: `ORDERS_TIMELINE_${s.key.toUpperCase()}`,
    }));
  });
}

