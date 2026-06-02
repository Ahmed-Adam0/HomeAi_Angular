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
    
    const lang = this.translationService.currentLang();
    if (lang === 'ar') {
      return `${numericValue.toLocaleString('ar-EG')} ج.م`;
    }
    return `$${numericValue.toFixed(2)}`;
  }
}
