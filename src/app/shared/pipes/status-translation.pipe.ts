import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';

@Pipe({
  name: 'statusTranslation',
  pure: false,
  standalone: true
})
export class StatusTranslationPipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(value: string | null | undefined, type: 'order' | 'payment'): string {
    if (!value) return '';

    // Convert camelCase or spaces/hyphens to standard snake_case uppercase
    let normalized = value
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s_-]+/g, '_')
      .toUpperCase();

    // Map legacy / custom raw status names to their exact localization keys in json files
    if (normalized === 'INPROGRESS') {
      normalized = 'IN_PROGRESS';
    } else if (normalized === 'AWAITINGCUSTOMERAPPROVAL') {
      normalized = 'AWAITING_CUSTOMER_APPROVAL';
    } else if (normalized === 'PENDINGPAYMENT') {
      normalized = 'PENDING_PAYMENT';
    }

    const prefix = type === 'order' ? 'ORDERS_STATUS_' : 'ORDERS_PAYMENT_';
    const key = `${prefix}${normalized}`;

    const translated = this.translationService.translate(key);

    // If no translation key exists (returns key itself), return a clean Title Case display name instead of the raw key
    if (translated === key) {
      return value
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[\s_-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    return translated;
  }
}
