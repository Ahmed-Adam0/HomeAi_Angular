import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { ICategory } from '../../interfaces/icategory';
import { RouterLink } from '@angular/router';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { LazyImageDirective } from '../../../../shared/directives/lazy-image.directive';

@Component({
  selector: 'app-category-list-page',
  standalone: true,
  imports: [RouterLink, SkeletonLoader, LazyImageDirective],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.css'
})
export class CategoryListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  readonly translationService = inject(TranslationService);

  readonly categories = signal<ICategory[]>([]);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.isLoading.set(true);
    setTimeout(() => {
      this.categoryService.getCategories().subscribe((data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      });
    }, 450);
  }
}
