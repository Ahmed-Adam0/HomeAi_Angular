import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';

@Pipe({
  standalone: true,
  name: 'currencyFormat',
  pure: false
})
export class CurrencyFormatPipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(value: number | string): string {
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numericValue)) {
      return '';
    }
    
    const formatted = numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const lang = this.translationService.currentLang();
    if (lang === 'ar') {
      return `${formatted} ج.م`;
    }
    return `EGP ${formatted}`;
  }
}
