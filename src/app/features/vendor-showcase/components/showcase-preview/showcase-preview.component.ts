import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShowcaseSlide } from '../../interfaces/showcase-slide.interface';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-showcase-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './showcase-preview.component.html',
  styleUrl: './showcase-preview.component.css'
})
export class ShowcasePreviewComponent {
  readonly translationService = inject(TranslationService);
  @Input({ required: true }) slide!: Partial<ShowcaseSlide>;
  @Input() previewImage: string | null = null;

  readonly isArabic = computed(() => this.translationService.currentLang() === 'ar');

  // Prevent default routing click in preview mode
  onCtaClick(event: Event): void {
    event.preventDefault();
  }
}
