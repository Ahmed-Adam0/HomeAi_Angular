import { Component, ElementRef, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { InspirationsService } from '../../services/inspirations.service';
import { InspirationCardComponent } from '../../components/inspiration-card/inspiration-card.component';
import { InspirationItem } from '../../interfaces/inspiration.interface';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-inspirations-page',
  standalone: true,
  imports: [CommonModule, InspirationCardComponent, TranslatePipe],
  templateUrl: './inspirations-page.component.html',
  styleUrl: './inspirations-page.component.css'
})
export class InspirationsPageComponent {
  private readonly inspirationsService = inject(InspirationsService);
  readonly translationService = inject(TranslationService);
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  // Gallery items list
  private readonly allInspirations = signal<InspirationItem[]>([]);

  // Pagination states
  readonly currentPage = signal<number>(1);
  readonly pageSize = 4; // 4 items per page

  constructor() {
    this.allInspirations.set(this.inspirationsService.getInspirations());
  }

  // Paginated items
  readonly paginatedInspirations = computed(() => {
    const items = this.allInspirations();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return items.slice(start, start + this.pageSize);
  });

  // Total page count
  readonly totalPages = computed(() => {
    return Math.ceil(this.allInspirations().length / this.pageSize) || 1;
  });

  // Pages array [1, 2, ...]
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;

    // Smooth scroll to top of gallery section
    if (isPlatformBrowser(this.platformId)) {
      const galleryEl = this.el.nativeElement.querySelector('.gallery-section');
      if (galleryEl) {
        galleryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Delay page state change slightly to allow smooth scroll to finish
    setTimeout(() => {
      this.currentPage.set(page);
    }, 150);
  }
}
