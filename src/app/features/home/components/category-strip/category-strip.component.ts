import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgFor } from '@angular/common';
import { CategoryService } from '../../../categories/services/category.service';
import { ICategory } from '../../../categories/interfaces/icategory';
import { TranslationService } from '../../../../shared/i18n/translation.service';

@Component({
  selector: 'app-category-strip',
  standalone: true,
  imports: [RouterLink, NgFor],
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
        // Intelligent duplicate image URL handler
        const seenUrls = new Set<string>();
        const processed = data.map((cat, idx) => {
          // If the image URL is empty, null, or has already been seen, replace it with a local fallback!
          if (!cat.imageUrl || seenUrls.has(cat.imageUrl)) {
            return {
              ...cat,
              imageUrl: this.getFallbackImage(cat.id || idx + 1)
            };
          }
          seenUrls.add(cat.imageUrl);
          return cat;
        });
        this.categories.set(processed);
      },
      error: (err) => {
        console.error('Failed to load categories in landing strip', err);
      }
    });
  }

  /**
   * Safe bilingual translate helper that prevents raw keys from showing in the UI,
   * falling back to the correct language translation instantly.
   */
  translate(key: string, fallbackEn: string, fallbackAr: string): string {
    const val = this.translationService.translate(key);
    if (val === key) {
      return this.translationService.currentLang() === 'ar' ? fallbackAr : fallbackEn;
    }
    return val;
  }

  getFallbackImage(id: number): string {
    const fallbacks: Record<number, string> = {
      1: '/assets/images/room_living.png',  // Furniture -> Living Room style
      2: '/assets/images/room_bedroom.png', // Lighting -> Bedroom style
      3: '/assets/images/room_dining.png',  // Rugs -> Dining Room style
      4: '/assets/images/room_office.png',  // Decor -> Office style
      5: '/assets/images/room_outdoor.png',
      6: '/assets/images/room_kids.png'
    };
    return fallbacks[id] || '/assets/images/room_living.png';
  }

  getCategoryProductCount(id: number): string {
    const counts: Record<number, string> = {
      1: '1,745',
      2: '1,120',
      3: '1,040',
      4: '960'
    };
    return counts[id] || '850';
  }
}
