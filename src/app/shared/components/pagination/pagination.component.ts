import { Component, Input, Output, EventEmitter, OnInit, HostListener, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent implements OnInit {
  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() itemsPerPage = 10;

  @Output() pageChange = new EventEmitter<number>();

  private platformId = inject(PLATFORM_ID);
  isMobile = false;

  ngOnInit(): void {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile = window.innerWidth < 576;
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage) || 1;
  }

  get pages(): (number | string)[] {
    const total = this.totalPages;
    if (total <= 1) {
      return [1];
    }

    const current = this.currentPage;
    const centerRange = this.isMobile ? 1 : 2;

    const pageSet = new Set<number>();
    pageSet.add(1);
    pageSet.add(total);

    const start = Math.max(1, current - centerRange);
    const end = Math.min(total, current + centerRange);
    for (let i = start; i <= end; i++) {
      pageSet.add(i);
    }

    const sortedPages = Array.from(pageSet).sort((a, b) => a - b);
    const result: (number | string)[] = [];

    for (let i = 0; i < sortedPages.length; i++) {
      if (i > 0) {
        const prev = sortedPages[i - 1];
        const curr = sortedPages[i];
        if (curr - prev === 2) {
          result.push(prev + 1);
        } else if (curr - prev > 2) {
          result.push('...');
        }
      }
      result.push(sortedPages[i]);
    }

    return result;
  }

  onPageClick(page: number | string): void {
    if (typeof page === 'number' && page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}

