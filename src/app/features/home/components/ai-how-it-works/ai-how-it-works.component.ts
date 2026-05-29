import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-ai-how-it-works',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ai-how-it-works.component.html',
  styleUrl: './ai-how-it-works.component.css'
})
export class AiHowItWorksComponent {
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
