import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from '../i18n/translation.service';

@Pipe({
  name: 'localized',
  pure: false,
  standalone: true,
})
export class LocalizedPipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform<T extends Record<string, any>>(
    item: T | null | undefined,
    field: string
  ): string {
    if (!item) return '';
    const lang = this.translationService.currentLang();
    const ar = item[`${field}Ar`];
    const en = item[`${field}En`];
    if (lang === 'ar') return (ar ?? en ?? '') as string;
    return (en ?? ar ?? '') as string;
  }
}
