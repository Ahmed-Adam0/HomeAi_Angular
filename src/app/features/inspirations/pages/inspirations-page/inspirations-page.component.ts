import { Component, AfterViewInit, ElementRef, Renderer2, inject, signal, computed, PLATFORM_ID } from '@angular/core';
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
export class InspirationsPageComponent implements AfterViewInit {
  private readonly inspirationsService = inject(InspirationsService);
  readonly translationService = inject(TranslationService);
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  // Gallery items list
  private readonly allInspirations = signal<InspirationItem[]>([]);

  // Pagination states
  readonly currentPage = signal<number>(1);
  readonly pageSize = 4; // 4 items per page (2 rows of 2 cards)

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

    setTimeout(() => {
      this.currentPage.set(page);
      this.triggerScrollRevealRefresh();
    }, 100);
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Trigger hero animations
    setTimeout(() => {
      const heroContent = this.el.nativeElement.querySelector('.hero-content');
      if (heroContent) {
        this.renderer.addClass(heroContent, 'hero-visible');
      }
      this.initScrollReveal();
    }, 100);
  }

  private initScrollReveal(): void {
    const items = this.el.nativeElement.querySelectorAll('.scroll-reveal');
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.renderer.addClass(entry.target, 'reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    items.forEach((item: HTMLElement) => observer.observe(item));
  }

  private triggerScrollRevealRefresh(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    setTimeout(() => {
      this.initScrollReveal();
    }, 150);
  }
}
