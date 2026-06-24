import { Component, ElementRef, inject, signal, computed, PLATFORM_ID, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { InspirationsService } from '../../services/inspirations.service';
import { InspirationCardComponent } from '../../components/inspiration-card/inspiration-card.component';
import { IInspiration } from '../../interfaces/inspiration.interface';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-inspirations-page',
  standalone: true,
  imports: [CommonModule, InspirationCardComponent, TranslatePipe],
  templateUrl: './inspirations-page.component.html',
  styleUrl: './inspirations-page.component.css'
})
export class InspirationsPageComponent implements OnInit {
  private readonly inspirationsService = inject(InspirationsService);
  readonly translationService = inject(TranslationService);
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  // Gallery items list
  readonly inspirations = signal<IInspiration[]>([]);

  // Pagination states
  readonly currentPage = signal<number>(1);
  readonly totalPages = signal<number>(1);
  readonly totalCount = signal<number>(0);
  readonly pageSize = 4; // 4 items per page

  // Loading and Error states
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadInspirations(1);
  }

  /**
   * Fetches the inspirations for the given page number.
   * @param page The page index to fetch.
   */
  loadInspirations(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.inspirationsService.getInspirations(page, this.pageSize).subscribe({
      next: (response) => {
        this.inspirations.set(response.data);
        this.currentPage.set(response.pagination.currentPage);
        this.totalPages.set(response.pagination.totalPages);
        this.totalCount.set(response.pagination.totalCount);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load inspirations', err);
        this.error.set('INSPIRATIONS.ERROR.FAILED_TO_LOAD');
        this.loading.set(false);
      }
    });
  }

  // Pages array [1, 2, ...]
  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  /**
   * Triggers page navigation and fetches the corresponding items.
   * @param page The target page index.
   */
  setPage(page: number): void {
    if (page < 1 || page > this.totalPages() || this.loading()) return;

    // Smooth scroll to top of gallery section
    if (isPlatformBrowser(this.platformId)) {
      const galleryEl = this.el.nativeElement.querySelector('.gallery-section');
      if (galleryEl) {
        galleryEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    // Delay page state change slightly to allow smooth scroll to finish
    setTimeout(() => {
      this.loadInspirations(page);
    }, 150);
  }
}
