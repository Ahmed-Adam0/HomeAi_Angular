import { Component, inject, signal } from '@angular/core';
import { SearchService, ISearchResult } from '../../services/search.service';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { RouterLink } from '@angular/router';
import { CurrencyFormatPipe } from '../../../../shared/pipes/currency-format.pipe';

@Component({
  selector: 'app-search-results-page',
  imports: [SearchBarComponent, EmptyStateComponent, RouterLink, CurrencyFormatPipe],
  templateUrl: './search-results-page.component.html',
  styleUrl: './search-results-page.component.css'
})
export class SearchResultsComponent {
  private searchService = inject(SearchService);

  readonly query = signal<string>('');
  readonly results = signal<ISearchResult[]>([]);
  readonly loaded = signal<boolean>(false);

  onSearchChange(q: string): void {
    this.query.set(q);
    if (!q.trim()) {
      this.results.set([]);
      this.loaded.set(false);
      return;
    }
    this.searchService.searchProducts(q).subscribe((data) => {
      this.results.set(data);
      this.loaded.set(true);
    });
  }
}
