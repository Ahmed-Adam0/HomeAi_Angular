import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, RouterLink, SearchBarComponent, TranslatePipe],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  private router = inject(Router);

  onSearch(query: string): void {
    if (query && query.trim()) {
      this.router.navigate(['/products'], { queryParams: { query } });
    }
  }
}
