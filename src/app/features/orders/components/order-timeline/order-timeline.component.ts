import { Component, computed, input, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { StatusTranslationPipe } from '../../../../shared/pipes/status-translation.pipe';
import { TimelineStepVm } from '../../data-access/orders.facade';
import { OrderStatus } from '../../interfaces';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-order-timeline',
  standalone: true,
  imports: [NgClass, TranslatePipe, StatusTranslationPipe],
  templateUrl: './order-timeline.component.html',
  styleUrl: './order-timeline.component.css',
})
export class OrderTimelineComponent {
  private readonly translationService = inject(TranslationService);

  readonly steps = input.required<TimelineStepVm[]>();
  readonly status = input<OrderStatus | null>(null);

  readonly isRtl = computed(() => {
    if (this.translationService.currentLang() === 'ar') {
      return true;
    }
    if (typeof document !== 'undefined') {
      return document.documentElement.getAttribute('dir') === 'rtl' || document.dir === 'rtl';
    }
    return false;
  });

  readonly isCancelled = computed(() => {
    const s = this.status();
    return s === 'cancelled' || s === 'refunded' || s === 'returned';
  });

  readonly stepClass = computed(() => {
    const steps = this.steps();
    
    return steps.map((s) => {
      const isTerminal = s.key === 'cancelled' || s.key === 'refunded' || s.key === 'returned';
      
      // Determine description key
      let descKey = 'ORDER_DETAILS_TIMELINE_MUTED';
      if (s.isComplete) {
        descKey = 'ORDER_DETAILS_TIMELINE_COMPLETED';
      } else if (s.isActive) {
        if (isTerminal) {
          descKey = `ORDER_DETAILS_TIMELINE_${s.key.toUpperCase()}`;
        } else {
          descKey = 'ORDER_DETAILS_TIMELINE_ACTIVE';
        }
      }

      return {
        ...s,
        isTerminalNegative: isTerminal,
        cls: {
          'fm-tl-step': true,
          'is-complete': s.isComplete,
          'is-active': s.isActive && !isTerminal,
          'is-cancelled': isTerminal,
        },
        labelKey: `ORDERS_STATUS_${s.key.toUpperCase()}`,
        descKey,
      };
    });
  });
}

