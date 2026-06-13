import { Component, inject } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';

@Component({
  selector: 'app-language-switcher',
  imports: [],
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.css'
})
export class LanguageSwitcher {
  protected translationService = inject(TranslationService);

  toggleLanguage(): void {
    const current = this.translationService.currentLang();
    const next = current === 'en' ? 'ar' : 'en';
    this.translationService.setLanguage(next);
    this.translationService.syncToBackend(next);
  }
}
