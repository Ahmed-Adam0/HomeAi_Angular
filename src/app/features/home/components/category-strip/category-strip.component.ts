import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';
import { CategoryService } from '../../../categories/services/category.service';
import { ICategory } from '../../../categories/interfaces/icategory';
import { TranslationService } from '../../../../shared/i18n/translation.service';
import { TranslatePipe } from '../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-category-strip',
  standalone: true,
  imports: [RouterLink, NgFor, TranslatePipe],
  templateUrl: './category-strip.component.html',
  styleUrl: './category-strip.component.css'
})
export class CategoryStripComponent implements OnInit {
  private categoryService = inject(CategoryService);
  readonly translationService = inject(TranslationService);

  readonly categories = signal<ICategory[]>([]);

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
      },
      error: (err) => {
        console.error('Failed to load categories in landing strip', err);
      }
    });
  }
}
