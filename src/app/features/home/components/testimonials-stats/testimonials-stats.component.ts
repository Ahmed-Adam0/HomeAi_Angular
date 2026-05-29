import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-testimonials-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './testimonials-stats.component.html',
  styleUrl: './testimonials-stats.component.css'
})
export class TestimonialsStatsComponent {
  readonly translationService = inject(TranslationService);

  /**
   * Safe bilingual translate helper that prevents raw keys from showing in the UI,
   * falling back to the correct language translation instantly.
   */
  translate(key: string, fallbackEn: string, fallbackAr: string): string {
    const val = this.translationService.translate(key);
    if (val === key) {
      return this.translationService.currentLang() === 'ar' ? fallbackAr : fallbackEn;
    }
    return val;
  }
}
